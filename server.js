// Importeer het npm pakket express uit de node_modules map
import express from 'express'

// Importeer de zelfgemaakte functie fetchJson uit de ./helpers map
import fetchJson from './helpers/fetch-json.js'

// Maak een nieuwe express app aan
const app = express()

// Stel ejs in als template engine
app.set('view engine', 'ejs')

// Stel de map met ejs templates in
app.set('views', './views')

// Gebruik de map 'public' voor statische resources, zoals stylesheets, afbeeldingen en client-side JavaScript
app.use(express.static('public'))

// Zorg dat werken met request data makkelijker wordt
app.use(express.urlencoded({extended: true}))

 // Haal alle stories uit de API op
const storiesData = await fetchJson('https://fdnd-agency.directus.app/items/tm_story');

// Haal alle playlists uit de API op
const playlistsData = await fetchJson('https://fdnd-agency.directus.app/items/tm_playlist?fields=*,image.id,image.height,image.width');

// Haal alle talen op
const languageData = await fetchJson('https://fdnd-agency.directus.app/items/tm_language');

let liked = [];

// Maak een GET route voor de index
app.get('/', async function (request, response) {
    // Render index.ejs uit de views map en geef de opgehaalde data mee als variabelen, genaamd stories en playlists
    response.render('index', { stories: storiesData.data, playlists: playlistsData.data, liked:liked });

})

// Maak een GET route voor de lessons page
app.get('/lessons', async function (request, response) {
  // Render lessons.ejs uit de views map en geef de opgehaalde data mee als variabelen, genaamd stories en playlists
  response.render('lessons', { stories: storiesData.data, playlists: playlistsData.data, language:languageData.data, liked:liked  });
})

// Maak een GET route voor de stories
app.get('/stories', async function (request, response) {
  let filteredStories = storiesData.data; // Initialize filteredStories met alle verhalen

  // Controleer als er een search query in de request is
  if (request.query.search) {
      const searchTerm = request.query.search.toLowerCase(); // verander search query naar lowercase
      filteredStories = filteredStories.filter(story =>
          story.title.toLowerCase().includes(searchTerm) || // Search bij titel
          story.summary.toLowerCase().includes(searchTerm) // Search bij samenvatting
      );
  }
  // Render stories.ejs van de views map
  response.render('stories', { stories: filteredStories });
});


app.get('/liked', function(request, response) {
  response.render('liked', {liked: liked})
})
// Maak een GET route voor een specifieke playlist op basis van de slug
app.get('/playlist/:slug', async function (request, response) {
  const slug = request.params.slug; // Haal de slug op uit de URL
  const playlist = playlistsData.data.find(playlist => playlist.slug === slug); // Zoek de playlist op basis van de slug

  if (playlist) {
      // Render een specifieke playlist.ejs template en geef de playlist data mee
      response.render('playlist', { playlist: playlist, liked:liked });
  } else {
      // Playlist niet gevonden, geef bijvoorbeeld een 404 pagina weer
      response.redirect(404, '/')
  }
});
// POST route for liking or unliking a playlist
app.post("/playlist/:slug/like", (request, response) => {
  const playlistSlug = request.params.slug;
  const playlist = playlistsData.data.find(
    (playlist) => playlist.slug === playlistSlug
  );

  if (playlist) {
    const index = liked.findIndex((item) => item.slug === playlist.slug);
    if (index === -1) {
      liked.push(playlist);
    } else {
      liked.splice(index, 1);
    }
  } else {
    console.log("Playlist not found:", playlistSlug);
  }

  if (request.body.enhanced) {
    // Render the 'partials/liked' template with the updated liked playlists
    response.render('partials/liked', { liked: liked });
  } else {
    // Redirect to '/lessons' if not enhanced
    response.redirect(303, '/lessons');
  }
});

// Stel het poortnummer in waar express op moet gaan luisteren
app.set('port', process.env.PORT || 8000)

// Start express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get('port')}`)
})