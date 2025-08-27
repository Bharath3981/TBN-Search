import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

// ---- Mock data (series + episodes) ----
type Item = {
  id: string;
  kind: 'series' | 'episode';
  title: string;
  description?: string;
  image: string;
};

const MOCK: Item[] = [
  { id: 's1', kind: 'series', title: 'Better Together', description: 'A series about faith and life.', image: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e1', kind: 'episode', title: 'Andy Stanley | Praise', description: 'Christmas generosity and hope.', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e2', kind: 'episode', title: 'ICON (Part 1)', description: 'Faith and purpose.', image: 'https://images.unsplash.com/photo-1522199794611-8e3e3ca7fbff?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e3', kind: 'episode', title: 'Under The Circumstances (Part 1)', description: 'Finding peace.', image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e4', kind: 'episode', title: 'Irresistible', description: 'Engaging the culture.', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e5', kind: 'episode', title: 'Guests: Andy Erwin & Brian Kilmeade', description: 'S1 E115', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e6', kind: 'episode', title: 'ICON (Part 2)', description: '', image: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e7', kind: 'episode', title: 'ICON (Part 3)', description: '', image: 'https://images.unsplash.com/photo-1494122477875-d3d3e5c2e277?q=80&w=1200&auto=format&fit=crop' },
  { id: 'e8', kind: 'episode', title: 'ICON (Part 4)', description: '', image: 'https://images.unsplash.com/photo-1517817748491-58e3b4079ab2?q=80&w=1200&auto=format&fit=crop' },
];

// Dark theme similar to the reference UI
const theme = createTheme({
  palette: { mode: 'dark', background: { default: '#0e0e0e', paper: '#121212' } },
  shape: { borderRadius: 10 },
});

function MediaCard({ item }: { item: Item }) {
  return (
    <Card sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
      <CardActionArea>
        <CardMedia component="img" height={180} image={item.image} alt={item.title} loading="lazy" />
        <CardContent sx={{ pt: 1.5 }}>
          <Typography variant="subtitle2" noWrap title={item.title}>
            {item.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            title={item.description || ''}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.25,
            }}
          >
            {item.description || ' '}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function App() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'episodes' | 'series'>('episodes');

  const series = useMemo(() => MOCK.filter(i => i.kind === 'series'), []);
  const episodes = useMemo(() => MOCK.filter(i => i.kind === 'episode'), []);
  const counts = { series: series.length, episodes: episodes.length };

  const visible = tab === 'series' ? series : episodes;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Container maxWidth={false} sx={{ py: 1.5, px: 3 }}>
            <TextField
              fullWidth
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              slotProps={{
                input: {
                  sx: { bgcolor: 'transparent' },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: q ? (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setQ('')}>
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
            </Container>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
          {/* Tabs header line with counts */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label={`Series (${counts.series})`} value="series" />
              <Tab label={`Episodes (${counts.episodes})`} value="episodes" />
            </Tabs>
          </Box>

          {/* Grid of placeholder cards */}
          <Box sx={{ width: '100%', maxWidth: 1480 }}>
            <Grid container spacing={2}>
              {visible.map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
                  <MediaCard item={item} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
