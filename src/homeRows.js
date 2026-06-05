export const MOVIE_CATEGORY_ROWS = [
  {
    id: 'action',
    title: 'Action Rush',
    withGenres: '28,12',
    sortBy: 'popularity.desc'
  },
  {
    id: 'horror',
    title: 'Horror & Suspense',
    withGenres: '27,53',
    sortBy: 'popularity.desc'
  },
  {
    id: 'comedy',
    title: 'Comedy Picks',
    withGenres: '35',
    sortBy: 'popularity.desc'
  },
  {
    id: 'romance-drama',
    title: 'Romance & Drama',
    withGenres: '10749,18',
    sortBy: 'popularity.desc'
  },
  {
    id: 'family',
    title: 'Family Night',
    withGenres: '10751,16',
    sortBy: 'popularity.desc'
  },
  {
    id: 'hidden-gems',
    title: 'Hidden Gems',
    withGenres: '9648,878',
    sortBy: 'vote_average.desc'
  }
];

export const BROWSE_ROW_CONFIGS = [
  {
    id: 'top-ten',
    title: 'Top 10 on KBY MAX',
    type: 'ranked',
    note: 'Ranked today',
    source: 'popular'
  },
  {
    id: 'my-list',
    title: 'My List',
    note: 'Saved on this browser',
    source: 'resume'
  },
  {
    id: 'movies',
    title: 'Movies',
    note: 'Curated movie shelves',
    source: 'moviesHub',
    quickLinks: [
      { id: 'trending-movies', label: 'Trending' },
      { id: 'action', label: 'Action' },
      { id: 'horror', label: 'Thrillers' },
      { id: 'comedy', label: 'Comedy' },
      { id: 'family', label: 'Family' },
      { id: 'top-rated', label: 'Top Rated' }
    ]
  },
  {
    id: 'tv-shows',
    title: 'TV Shows',
    note: 'Series and K-dramas',
    source: 'tvHub',
    quickLinks: [
      { id: 'trending-shows', label: 'Trending' },
      { id: 'k-dramas', label: 'K-Dramas' },
      { id: 'tv-drama', label: 'Drama' },
      { id: 'tv-comedy', label: 'Comedy' }
    ]
  },
  {
    id: 'trending-movies',
    title: 'Trending Movies',
    note: 'Popular right now',
    source: 'trendingMovies'
  },
  {
    id: 'trending-shows',
    title: 'Trending Shows',
    note: 'Series people are watching',
    source: 'trendingShows'
  },
  {
    id: 'k-dramas',
    title: 'Binge-Worthy K-Dramas',
    note: 'Korean series picks',
    source: 'kDramas'
  },
  {
    id: 'tv-drama',
    title: 'Prestige TV Drama',
    note: 'Story-rich series',
    source: 'discoverTV',
    withGenres: '18',
    sortBy: 'popularity.desc'
  },
  {
    id: 'tv-comedy',
    title: 'TV Comedy Picks',
    note: 'Easy series for lighter nights',
    source: 'discoverTV',
    withGenres: '35',
    sortBy: 'popularity.desc'
  },
  ...MOVIE_CATEGORY_ROWS.map((row) => ({
    ...row,
    note: 'Curated by genre',
    source: 'discover'
  })),
  {
    id: 'top-rated',
    title: 'Critically Acclaimed',
    note: 'Highly rated films',
    source: 'topRated'
  }
];

export const getBrowseRowConfig = (id) => {
  return BROWSE_ROW_CONFIGS.find((row) => row.id === id);
};

const createRow = ({ id, title, items, type = 'poster', note = '', browsePath = `/browse/${id}` }) => ({
  id,
  title,
  items: Array.isArray(items) ? items : [],
  type,
  note,
  browsePath
});

export const buildHomeRows = ({
  topTen = [],
  resumeItems = [],
  trendingMovies = [],
  trendingShows = [],
  kDramas = [],
  topRated = [],
  categoryRows = []
} = {}) => {
  const rows = [
    createRow({
      id: 'top-ten',
      title: 'Top 10 on KBY MAX',
      items: topTen,
      type: 'ranked',
      note: 'Ranked today'
    })
  ];

  if (resumeItems.length > 0) {
    rows.push(createRow({
      id: 'resume',
      title: 'Pick Up Where You Left Off',
      items: resumeItems,
      type: 'resume',
      note: 'Saved on this browser',
      browsePath: ''
    }));
  }

  rows.push(
    createRow({
      id: 'trending-movies',
      title: 'Trending Movies',
      items: trendingMovies,
      note: 'Popular right now'
    }),
    createRow({
      id: 'trending-shows',
      title: 'Trending Shows',
      items: trendingShows,
      note: 'Series people are watching'
    }),
    createRow({
      id: 'k-dramas',
      title: 'Binge-Worthy K-Dramas',
      items: kDramas,
      note: 'Korean series picks'
    }),
    ...categoryRows.map((row) => createRow(row)),
    createRow({
      id: 'top-rated',
      title: 'Critically Acclaimed',
      items: topRated,
      note: 'Highly rated films'
    })
  );

  return rows.filter((row) => row.items.length > 0);
};
