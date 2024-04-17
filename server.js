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
const playlistsData = await fetchJson('https://fdnd-agency.directus.app/items/tm_playlist');

// Haal alle talen op
const languageData = await fetchJson('https://fdnd-agency.directus.app/items/tm_language');

let likes = [];
// Maak een GET route voor de index
app.get('/', async function (request, response) {
    // Render index.ejs uit de views map en geef de opgehaalde data mee als variabelen, genaamd stories en playlists
    response.render('index', { stories: storiesData.data, playlists: playlistsData.data });

})

// Maak een GET route voor de lessons page
app.get('/lessons', async function (request, response) {
  // Render lessons.ejs uit de views map en geef de opgehaalde data mee als variabelen, genaamd stories en playlists
  response.render('lessons', { stories: storiesData.data, playlists: playlistsData.data, language:languageData.data, likes: likes });
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

// Maak een GET route voor een specifieke playlist op basis van de slug
app.get('/playlist/:slug', async function (request, response) {
  const slug = request.params.slug; // Haal de slug op uit de URL
  const playlist = playlistsData.data.find(playlist => playlist.slug === slug); // Zoek de playlist op basis van de slug

  if (playlist) {
      // Render een specifieke playlist.ejs template en geef de playlist data mee
      response.render('playlist', { playlist: playlist, likes: likes });
  } else {
      // Playlist niet gevonden, geef bijvoorbeeld een 404 pagina weer
      response.redirect(404, '/')
  }
});



// maak een POST route voor lessons (like)
app.post('/playlist/:slug/like', function(request, response) {
    const playlistSlug = request.params.slug;
    const action = request.body.action; // Retrieve the value of the 'actie' parameter from the form
  
    // Implement the logic to handle liking or unliking the playlist
    if (action === 'like') {
      likes[playlistSlug] = true
      likes.push(request.body.likes);
      // Handle 'like' action
    } else if (action === 'unlike') {
      likes[playlistSlug] = false
    }
    response.redirect('/lessons')
    });


//deze post werkt (nog)niet ivm forbidden toegang
/*app.post('/create-playlist', async function (request, response) {
  try {
      const { title, description, slug, stories, languageId } = request.body;

      if (!title || !description || !slug || !languageId || !stories || stories.length === 0) {
          return response.status(400).json({ message: 'Missing required data' });
      }

      // Construct the data object to send to the API
      const createPlaylist = {
          title: title,
          description: description,
          slug: slug,
          language_id: languageId,
          stories: stories
      };

      // Send POST request to api
      const apiResponse = await fetch('https://fdnd-agency.directus.app/items/tm_playlist', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPlaylist)
      });

      // Check if request was successful
      if (!apiResponse.ok) {
          // Handle API error response
          console.error('Failed to create playlist:', apiResponse.statusText);
          return response.status(apiResponse.status).json({ message: 'Failed to create playlist' });
      }

      // Redirect back to the lessons page
      response.redirect('/lessons');
  } catch (error) {
      // Handle error
      console.error('Error creating playlist:', error);
      response.status(500).json({ message: 'Internal Server Error' });
  }
});
*/
app.post('/create-playlist', function (request, response) {
  try {
      const { title, description, slug, stories, languageId } = request.body;

      console.log('Received playlist data:');
      console.log('Title:', title);
      console.log('Description:', description);
      console.log('Slug:', slug);
      console.log('Language ID:', languageId);
      console.log('Stories:', stories);

      response.status(200).json({ 
          message: 'Playlist made',
          title: title,
          description: description,
          slug: slug,
          languageId: languageId,
          stories: stories
      });
  } catch (error) {
      // Handle error
      console.error('Error creating playlist:', error);
      response.status(500).json({ message: 'Internal Server Error' });
  }
});



// Maak een POST route voor de index
app.post('/', function (request, response) {
  // Er is nog geen afhandeling van POST, redirect naar GET op /
  response.redirect(303, '/')
})

// Stel het poortnummer in waar express op moet gaan luisteren
app.set('port', process.env.PORT || 8000)

// Start express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get('port')}`)
})