"""ClimateDualNet model definition matching ISRO_BAH_2026 training notebook."""

from __future__ import annotations

from typing import List, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

N_CHANNELS = 3
HISTORY_LEN = 30
FORECAST_LEN = 7


class ResidualBlock(nn.Module):
    """Two-conv residual block with BatchNorm and ReLU."""

    def __init__(self, in_ch: int, out_ch: int) -> None:
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_ch)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_ch)
        self.skip = (
            nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 1, bias=False),
                nn.BatchNorm2d(out_ch),
            )
            if in_ch != out_ch
            else nn.Identity()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = F.relu(self.bn1(self.conv1(x)), inplace=True)
        h = self.bn2(self.conv2(h))
        return F.relu(h + self.skip(x), inplace=True)


class CBAM(nn.Module):
    """Convolutional Block Attention Module (channel + spatial attention)."""

    def __init__(self, channels: int, reduction: int = 16) -> None:
        super().__init__()
        mid = max(channels // reduction, 4)
        self.ca_fc1 = nn.Linear(channels, mid)
        self.ca_fc2 = nn.Linear(mid, channels)
        self.sa_conv = nn.Conv2d(2, 1, 7, padding=3, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg_pool = x.mean(dim=[2, 3])
        max_pool = x.amax(dim=[2, 3])
        ca = (
            torch.sigmoid(
                self.ca_fc2(F.relu(self.ca_fc1(avg_pool)))
                + self.ca_fc2(F.relu(self.ca_fc1(max_pool)))
            )
            .unsqueeze(-1)
            .unsqueeze(-1)
        )
        x = x * ca
        sa_in = torch.cat(
            [x.mean(dim=1, keepdim=True), x.amax(dim=1, keepdim=True)], dim=1
        )
        sa = torch.sigmoid(self.sa_conv(sa_in))
        return x * sa


class ConvLSTMCell(nn.Module):
    """A single ConvLSTM cell (one timestep)."""

    def __init__(self, in_ch: int, hidden_ch: int, kernel: int = 3) -> None:
        super().__init__()
        pad = kernel // 2
        self.hidden_ch = hidden_ch
        self.gates = nn.Conv2d(
            in_ch + hidden_ch, 4 * hidden_ch, kernel, padding=pad, bias=True
        )

    def forward(
        self,
        x: torch.Tensor,
        h: torch.Tensor,
        c: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        combined = torch.cat([x, h], dim=1)
        gates = self.gates(combined)
        i, f, g, o = gates.chunk(4, dim=1)
        i = torch.sigmoid(i)
        f = torch.sigmoid(f)
        g = torch.tanh(g)
        o = torch.sigmoid(o)
        c_next = f * c + i * g
        h_next = o * torch.tanh(c_next)
        return h_next, c_next

    def init_hidden(
        self, batch: int, h: int, w: int, device: torch.device
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        z = torch.zeros(batch, self.hidden_ch, h, w, device=device)
        return z, z.clone()


class ConvLSTM(nn.Module):
    """Multi-layer ConvLSTM that processes a sequence of spatial feature maps."""

    def __init__(
        self,
        in_ch: int,
        hidden_ch: int,
        n_layers: int = 2,
        dropout: float = 0.2,
    ) -> None:
        super().__init__()
        self.n_layers = n_layers
        cells = [
            ConvLSTMCell(in_ch if i == 0 else hidden_ch, hidden_ch)
            for i in range(n_layers)
        ]
        self.cells = nn.ModuleList(cells)
        self.dropout = nn.Dropout2d(p=dropout)

    def forward(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, List[Tuple[torch.Tensor, torch.Tensor]]]:
        B, T, _, H, W = x.shape
        device = x.device
        states = [cell.init_hidden(B, H, W, device) for cell in self.cells]

        layer_input = x
        for layer_idx, cell in enumerate(self.cells):
            h, c = states[layer_idx]
            outputs = []
            for t in range(T):
                h, c = cell(layer_input[:, t], h, c)
                outputs.append(h)
            layer_input = torch.stack(outputs, dim=1)
            if layer_idx < self.n_layers - 1:
                B2, T2, C2, H2, W2 = layer_input.shape
                layer_input = self.dropout(
                    layer_input.view(B2 * T2, C2, H2, W2)
                ).view(B2, T2, C2, H2, W2)
            states[layer_idx] = (h, c)

        return layer_input, states


class TemporalSelfAttention(nn.Module):
    """Lightweight temporal self-attention over the T time dimension."""

    def __init__(self, hidden_ch: int, n_heads: int = 4) -> None:
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.attn = nn.MultiheadAttention(
            embed_dim=hidden_ch,
            num_heads=n_heads,
            dropout=0.1,
            batch_first=True,
        )
        self.norm = nn.LayerNorm(hidden_ch)
        self.proj = nn.Linear(hidden_ch, hidden_ch)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, C, H, W = x.shape
        tokens = self.pool(x.view(B * T, C, H, W)).view(B, T, C)
        attn_out, _ = self.attn(tokens, tokens, tokens)
        weights = torch.sigmoid(self.proj(self.norm(attn_out)))
        return x * weights.view(B, T, C, 1, 1)


class ClimateDualNet(nn.Module):
    """Spatiotemporal climate forecasting model."""

    def __init__(
        self,
        in_channels: int = N_CHANNELS,
        history_len: int = HISTORY_LEN,
        forecast_len: int = FORECAST_LEN,
        enc_channels: Tuple[int, ...] = (32, 64, 128),
        lstm_hidden: int = 128,
        n_lstm_layers: int = 2,
        lstm_dropout: float = 0.2,
    ) -> None:
        super().__init__()
        self.in_channels = in_channels
        self.history_len = history_len
        self.forecast_len = forecast_len
        self.lstm_hidden = lstm_hidden

        self.enc1 = ResidualBlock(in_channels, enc_channels[0])
        self.enc2 = ResidualBlock(enc_channels[0], enc_channels[1])
        self.enc3 = ResidualBlock(enc_channels[1], enc_channels[2])
        self.cbam = CBAM(enc_channels[2])

        self.convlstm = ConvLSTM(
            in_ch=enc_channels[2],
            hidden_ch=lstm_hidden,
            n_layers=n_lstm_layers,
            dropout=lstm_dropout,
        )
        self.temp_attn = TemporalSelfAttention(lstm_hidden, n_heads=4)

        self.dec1 = ResidualBlock(lstm_hidden + enc_channels[2], enc_channels[1])
        self.dec2 = ResidualBlock(enc_channels[1] + enc_channels[1], enc_channels[0])
        self.dec3 = ResidualBlock(enc_channels[0] + enc_channels[0], enc_channels[0])

        head_in = enc_channels[0]
        self.head_rainfall = nn.Sequential(
            nn.Conv2d(head_in, head_in, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(head_in, forecast_len, 1),
        )
        self.head_tmax = nn.Sequential(
            nn.Conv2d(head_in, head_in, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(head_in, forecast_len, 1),
        )
        self.head_tmin = nn.Sequential(
            nn.Conv2d(head_in, head_in, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(head_in, forecast_len, 1),
        )

    def _encode_frame(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        s1 = self.enc1(x)
        s2 = self.enc2(s1)
        s3 = self.cbam(self.enc3(s2))
        return s1, s2, s3

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, C, H, W = x.shape
        enc_frames = []
        for t in range(T):
            s1, s2, s3 = self._encode_frame(x[:, t])
            enc_frames.append((s1, s2, s3))

        enc3_seq = torch.stack([f[2] for f in enc_frames], dim=1)
        skip_s1 = enc_frames[-1][0]
        skip_s2 = enc_frames[-1][1]
        skip_s3 = enc_frames[-1][2]

        lstm_out, _ = self.convlstm(enc3_seq)
        attn_out = self.temp_attn(lstm_out)
        context = attn_out[:, -1]

        d1 = self.dec1(torch.cat([context, skip_s3], dim=1))
        d2 = self.dec2(torch.cat([d1, skip_s2], dim=1))
        d3 = self.dec3(torch.cat([d2, skip_s1], dim=1))

        rain = self.head_rainfall(d3)
        tmax = self.head_tmax(d3)
        tmin = self.head_tmin(d3)
        return torch.stack([rain, tmax, tmin], dim=2)
