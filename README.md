# Label editor

Although [label-studio](https://labelstud.io/) is great for labelling data, it did not have a template to add arbitrary annotations. For example, to annotate certain facts or observations in articles, the NER template was not sufficient. It does allow you to quickly select text, but often, the appropriate text was split across words, or the exact text was not what was desired (e.g. the text would say 'seven million', and the required annotation was '7000000').

## Installation

The application runs standalone in the browser. It does not use a server backend, so all data is kept locally.

## Usage instructions

1. Upload JSON array with data (for now, only JSON arrays are supported)
2. Open settings and setup your template. The template converts each data item to markdown, and the markdown is rendered as HTML. See the example below.
3. Define your annotation object that you want to create. It is based on [mithril-ui-forms](https://github.com/erikvullings/mithril-ui-form), i.e. you provide a JSON object that is converted to a HTML form which you can use to generate your annotation object.

![image](https://github.com/user-attachments/assets/bcd4fd11-5859-4d86-b481-25e8b1e380a2)

### Example object

Assume you need to annotate news articles like the following:

```json
{
  "leRowId": 2,
  "_id": "7764ec2ce44e533edf0dbf3d94994b38",
  "_source": {
    "text_en": "The Mexican City Reform Agency. MX. - In the last 15 days. The Armed Forces seized $4,437,000 from organized crime.. The report delivered yesterday by the security cabinet to President Andrés Manuel López Obrador indicates that from 9 to 23 May were secured to gangs of organized crime 2 thousand 640 kilos of marijuana. Other, of a thickness of not more than 10 mm. 350 kilos of cocaine and 1. 5 of opium rubber. In military operations, 582 people were arrested.. Of these, three were injured.. Of the total. Only 20 have been released.. Five deaths and seven clashes with the Castro corporations and the Federal Police were recorded. 180 long and short guns were also seized.. As well as two aircraft and 984 vehicles. In addition to 8 properties. The report. presented by the President at his morning conference. The estimated price of the drug is 245 million 821 thousand 736 pesos. about $12.9 million.. President Andrés Manuel López Obrador reported that an inventory of all the assets confiscated from the crime is being carried out. whether for common crime or white collar crime. We already have the constitutional reform. The extinction of domain. which allows all these goods to be obtained for the development of Mexico. He pointed. We have the case. For example,. of the confiscation of money. than before. According to the report they presented to me. I was going to the Army Bank.. to the Army Bank vaults. And now it goes to the public ministries. to the Attorney General's Office. (Reform Agency)",
    "title_en": "They're adding more than $17 million in cash and drug seizures to organized crime.",
    "url": "https://noticaribe.com.mx/2019/05/25/suman-mas-de-17-millones-de-dolares-en-decomisos-de-efectivo-y-drogas-al-crimen-organizado/"
  }
}
```
The `leRowId` is added when importing, and indicates the current index of the article in the local database.

### Example template 

```md
# {{leRowId}}. {{_source.title_en}}

{{_source.text_en}}

[Go to article]({{_source.url}}), ID: {{_id}}
```

### Example form 

```json
[
  {
    "id": "id",
    "value": "{{_id}}",
    "type": "none"
  },
  {
    "id": "annotator",
    "value": "{{annotator}}",
    "type": "none"
  },
  {
    "id": "created",
    "autogenerate": "datetime"
  },
  {
    "id": "facts",
    "label": "Facts",
    "repeat": true,
    "type": [
      {
        "id": "good",
        "type": "select",
        "className": "col s4",
        "options": [
          {
            "id": "cocaine",
            "label": "Cocaine"
          },
          {
            "id": "money",
            "label": "Money"
          }
        ]
      },
      {
        "id": "quantity",
        "label": "Quantity",
        "className": "col s4",
        "type": "text"
      },
      {
        "id": "unit",
        "label": "Unit",
        "className": "col s4",
        "type": "text"
      }
    ]
  }
]
```

## Development

```bash
pnpm i
npm start
```
