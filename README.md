# Computer Vision Companies in the World

An interactive world map of computer vision companies, browsable by country.

Hover a country to see the companies based there; click one to open its page.
Each entry carries a short description of the company's focus.

Built with [jQuery](https://github.com/jquery/jquery) and
[jQVMap](https://github.com/manifestinteractive/jqvmap), with a
[GSAP](https://github.com/greensock/GSAP) title effect.

## Layout

    index.html     the map page
    assets/        css, js, jqvmap map scripts and the favicon
    data.json      company data, keyed by ISO country code

## Usage

Open `index.html` over any static file server, for example:

```
python3 -m http.server 8000
```

## Data format

`data.json` is keyed by country code; each country holds a display title and a
list of companies:

```json
{
  "ca": {
    "t": "Canada",
    "data": [
      {
        "title": "ClmTec",
        "desc": "medical Image Analysis, digital pathology",
        "url": "http://www.cimtec-canada.ca/"
      }
    ]
  }
}
```
