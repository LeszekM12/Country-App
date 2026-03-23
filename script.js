'use strict';

const countriesContainer = document.querySelector('.countries');

// ============================================================
// RENDER
// ============================================================

const renderCountry = (data, className = '') => {
  const lang = Object.values(data.languages || {})[0] ?? '—';
  const cur = Object.values(data.currencies || {})[0]?.name ?? '—';
  const pop = (+data.population / 1000000).toFixed(2);

  const clickHandler = className === 'neighbour'
    ? `onclick="getCountry('${data.name.common}')" style="cursor:pointer;"`
    : '';

  const html = `
    <article class="country ${className}" ${clickHandler}>
      <img class="country__img" src="${data.flags?.svg ?? data.flags?.png}" />
      <div class="country__data">
        <h3 class="country__name">${data.name.common}</h3>
        <h4 class="country__region">${data.region}</h4>
        <p class="country__row"><span>👫</span>${pop}M</p>
        <p class="country__row"><span>🗣️</span>${lang}</p>
        <p class="country__row"><span>💰</span>${cur}</p>
      </div>
    </article>
  `;

  if (className === 'neighbour') {
    let wrapper = document.querySelector('.neighbours-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'neighbours-wrapper';
      wrapper.innerHTML = '<p class="neighbours-label">Neighbour countries</p><div class="neighbours-grid"></div>';
      countriesContainer.appendChild(wrapper);
    }
    wrapper.querySelector('.neighbours-grid').insertAdjacentHTML('beforeend', html);
  } else {
    countriesContainer.insertAdjacentHTML('beforeend', html);
  }
};

const renderNoNeighbours = (countryName) => {
  const html = `
    <div class="no-neighbours">
      <span class="no-neighbours__icon">🏝️</span>
      <p class="no-neighbours__title">Island nation</p>
      <p class="no-neighbours__text">${countryName} has no neighbouring countries — it's surrounded by water.</p>
    </div>
  `;
  let wrapper = document.querySelector('.neighbours-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'neighbours-wrapper';
    wrapper.innerHTML = '<p class="neighbours-label">Neighbour countries</p>';
    countriesContainer.appendChild(wrapper);
  }
  wrapper.insertAdjacentHTML('beforeend', html);
};

const renderError = (msg) => {
  countriesContainer.insertAdjacentHTML('beforeend', `<p class="error">${msg}</p>`);
};

// ============================================================
// FETCH HELPERS
// ============================================================

const getJSON = (url, errorMsg = 'Something went wrong') => {
  return fetch(url).then(res => {
    if (!res.ok) throw new Error(`${errorMsg} (${res.status})`);
    return res.json();
  });
};

// ============================================================
// GET COUNTRY + ALL NEIGHBOURS
// ============================================================

const getCountry = (country) => {
  countriesContainer.innerHTML = '';

  getJSON(`https://restcountries.com/v3.1/name/${country}`, 'Country not found')
    .catch(() =>
      getJSON(`https://restcountries.com/v3.1/translation/${country}`, 'Country not found')
    )
    .then(data => {
      renderCountry(data[0]);
      const neighbours = data[0].borders;

      if (!neighbours || neighbours.length === 0) {
        renderNoNeighbours(data[0].name.common);
        return; // brak sąsiadów — kończymy, bez rzucania błędu
      }

      return Promise.all(
        neighbours.map(code =>
          getJSON(`https://restcountries.com/v3.1/alpha/${code}`, 'Country not found')
        )
      );
    })
    .then(neighboursData => {
      if (!neighboursData) return; // island nation — już obsłużone
      neighboursData.forEach(data => renderCountry(data[0], 'neighbour'));
    })
    .catch(err => {
      console.error(`${err} 😤`);
      renderError(`Something went wrong: ${err.message}. Try again!`);
    })
    .finally(() => {
      countriesContainer.style.opacity = '1';
    });
};

// ============================================================
// WHERE AM I
// ============================================================

const whereAmI = () => {
  return fetch('https://api.bigdatacloud.net/data/reverse-geocode-client')
    .then(res => {
      if (!res.ok) throw new Error(`Problem with geocoding ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log(`You are in ${data.city}, ${data.countryName}`);
      return data.countryName;
    })
    .catch(err => console.error(err.message));
};

// ============================================================
// BUTTONS
// ============================================================

document.getElementById('btn-search').addEventListener('click', () => {
  const country = document.getElementById('country-input').value.trim();
  if (country) getCountry(country);
});

document.getElementById('country-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const country = e.target.value.trim();
    if (country) getCountry(country);
  }
});

document.getElementById('btn-location').addEventListener('click', () => {
  whereAmI().then(countryName => {
    if (countryName) getCountry(countryName);
  });
});
