// Hae teatterit
fetch('https://www.finnkino.fi/xml/TheatreAreas/')
  .then(response => response.text())
  .then(data => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(data, 'text/xml');
    const areas = xml.getElementsByTagName('TheatreArea');
    const select = document.getElementById('teatteri');

    // Käy läpi kaikki teatterialueet
    Array.from(areas).forEach(area => {
      const id = area.querySelector('ID').textContent;
      const name = area.querySelector('Name').textContent;

      // Näytä vain Helsingin, Vantaan ja Espoon teatterit
      if (name.includes('Helsinki') || name.includes('Vantaa') || name.includes('Espoo')) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        select.appendChild(option);
      }
    });
  });

// Hae päivämäärät ja täytä päivämäärävalitsin
fetch('https://www.finnkino.fi/xml/ScheduleDates/')
  .then(response => response.text())
  .then(data => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(data, 'text/xml');
    const dates = xml.getElementsByTagName('dateTime');
    const dateSelect = document.getElementById('dateSelect');

    Array.from(dates).forEach(date => {
      const option = document.createElement('option');
      option.value = date.textContent;
      option.textContent = new Date(date.textContent).toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      dateSelect.appendChild(option);
    });

    // Aseta päivämäärävalitsimen oletusarvoksi nykyinen päivämäärä
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0]; // Muotoile yyyy-mm-dd
    dateSelect.value = formattedToday;
  });

// Kuuntele teatterin ja päivämäärän valintaa
document.getElementById('dateSelect').addEventListener('change', fetchMovies);
document.getElementById('teatteri').addEventListener('change', fetchMovies);

document.getElementById('teatteri').addEventListener('change', function () {
  const instructionText = document.getElementById('instructionText');
  if (this.value) {
    instructionText.style.display = 'none'; // Piilota teksti
  }
});

function fetchMovies() {
  const theatreId = document.getElementById('teatteri').value;
  const selectedDate = document.getElementById('dateSelect').value;

  if (!theatreId || !selectedDate) return;

  // Muunna päivämäärä yyyy-mm-dd -> dd.mm.yyyy
  const formattedDate = selectedDate.split('-').reverse().join('.');

  // Hakee elokuvat näytösajan perusteella
  fetch(`https://www.finnkino.fi/xml/Schedule/?area=${theatreId}&dt=${formattedDate}`)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(data, 'text/xml');
      const shows = xml.getElementsByTagName('Show');
      const container = document.getElementById('moviesContainer');
      container.innerHTML = '';

      const search = document.getElementById('searchInput').value.toLowerCase();

      Array.from(shows).forEach(show => {
        const title = show.querySelector('Title').textContent;
        if (search && !title.toLowerCase().includes(search)) return;

        const image = show.querySelector('EventLargeImagePortrait').textContent;
        const startTime = new Date(show.querySelector('dttmShowStart').textContent);
        const length = show.querySelector('LengthInMinutes').textContent;
        const theatre = show.querySelector('Theatre').textContent; // Hae teatterin nimi

        const displayDate = startTime.toLocaleDateString('fi-FI', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
          <img src="${image}" alt="${title}">
          <h3>${title}</h3>
          <p>Teatteri: ${theatre}</p> <!-- Näytä teatterin nimi -->
          <p>Kesto: ${length} min</p>
          <p>Päivämäärä: ${displayDate}</p>
          <p>Alkaa: ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        `;
        container.appendChild(card);
      });
    });
}

// Suorita haku uudestaan, kun käyttäjä kirjoittaa
document.getElementById('searchInput').addEventListener('input', function () {
  document.getElementById('teatteri').dispatchEvent(new Event('change'));
});
