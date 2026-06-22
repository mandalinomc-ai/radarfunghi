import { REGIONAL_REGULATIONS, type RegionalRegulation } from "./regionalRegulations";

export type PatentinoRegionId = "campania" | "molise" | "basilicata";

export interface PatentinoStep {
  step: number;
  title: string;
  description: string;
}

export interface PatentinoLink {
  id: string;
  title: string;
  url: string;
  kind: "official" | "law" | "asl" | "education" | "payment";
  description: string;
}

export interface PatentinoRegionGuide {
  regionId: PatentinoRegionId;
  regionLabel: string;
  badge: string;
  intro: string;
  whoNeedsIt: string[];
  steps: PatentinoStep[];
  documents: string[];
  costs: string[];
  renewal: string;
  limits: string[];
  regulation: RegionalRegulation;
  links: PatentinoLink[];
  faq: { q: string; a: string }[];
}

const CAMPANIA_LINKS: PatentinoLink[] = [
  {
    id: "camp-portal",
    title: "Portale ufficiale Funghi e Tartufi — Campania",
    url: "https://funghietartufi.regione.campania.it/",
    kind: "official",
    description: "Informazioni, modulistica, calendario raccolta e sportelli.",
  },
  {
    id: "camp-info",
    title: "Guida al tesserino e normativa (PDF/sito)",
    url: "https://funghietartufi.regione.campania.it/docfunghietartufi/funghi_info.php",
    kind: "law",
    description: "Testo integrativo L.R. 8/2007 e FAQ regionali.",
  },
  {
    id: "camp-pagopa",
    title: "Convalida annuale — PagoPA (cod. 1159)",
    url: "https://www.regione.campania.it/pagamenti/",
    kind: "payment",
    description: "Pagamento €30 per rinnovo annuale del tesserino quinquennale.",
  },
  {
    id: "camp-regione",
    title: "Regione Campania — Agricoltura",
    url: "https://www.regione.campania.it/regione/it/tematiche/agricoltura",
    kind: "official",
    description: "Direzione competente e comunicati ufficiali.",
  },
  {
    id: "asl-benevento",
    title: "ASL Benevento — controllo raccolto",
    url: "https://www.aslbenevento.it/",
    kind: "asl",
    description: "Porta i funghi per identificazione prima del consumo (Sannio).",
  },
  {
    id: "asl-caserta",
    title: "ASL Caserta — prevenzione",
    url: "https://www.aslcaserta.it/",
    kind: "asl",
    description: "Servizio micologico provincia di Caserta / Taburno.",
  },
  {
    id: "asl-napoli",
    title: "ASL Napoli 2 Nord",
    url: "https://www.aslnapoli2nord.it/",
    kind: "asl",
    description: "Controlli micologici area nord Napoli.",
  },
  {
    id: "min-salute",
    title: "Ministero della Salute — funghi",
    url: "https://www.salute.gov.it/portale/funghi",
    kind: "official",
    description: "Linee guida nazionali, rischi e buone pratiche.",
  },
  {
    id: "iss-cav",
    title: "ISS — Centri Antiveleni (CAV)",
    url: "https://www.iss.it/cav",
    kind: "official",
    description: "Emergenze sospetto avvelenamento: 24/7.",
  },
];

const MOLISE_LINKS: PatentinoLink[] = [
  {
    id: "molise-portal",
    title: "Regione Molise — portale istituzionale",
    url: "https://www.regione.molise.it/",
    kind: "official",
    description: "Cerca sezione Agricoltura / autorizzazioni raccolta funghi.",
  },
  {
    id: "molise-law",
    title: "L.R. Molise 23/1999 (riferimento)",
    url: "https://www.regione.molise.it/",
    kind: "law",
    description: "Normativa base raccolta funghi epigei in Molise.",
  },
  {
    id: "asl-campobasso",
    title: "ASReM Molise (sanità)",
    url: "https://www.asrem.molise.it/",
    kind: "asl",
    description: "Controllo micologico raccolto — Matese e province molise.",
  },
  {
    id: "min-salute-m",
    title: "Ministero della Salute — funghi",
    url: "https://www.salute.gov.it/portale/funghi",
    kind: "official",
    description: "Indicazioni nazionali valide anche in Molise.",
  },
];

const BASILICATA_LINKS: PatentinoLink[] = [
  {
    id: "bas-portal",
    title: "Regione Basilicata",
    url: "https://www.regione.basilicata.it/",
    kind: "official",
    description: "Sportello tesserino e regolamenti raccolta.",
  },
  {
    id: "bas-law",
    title: "L.R. Basilicata 22/1999 (riferimento)",
    url: "https://www.regione.basilicata.it/",
    kind: "law",
    description: "Normativa raccolta funghi epigei in Basilicata.",
  },
  {
    id: "asp-bas",
    title: "ASP Basilicata",
    url: "https://www.aspbasilicata.it/",
    kind: "asl",
    description: "Controlli ASL / micologo prima del consumo.",
  },
  {
    id: "pollino",
    title: "Parco del Pollino — regolamento",
    url: "https://www.parcopollino.it/",
    kind: "law",
    description: "Vincoli aggiuntivi in area protetta — verifica sempre.",
  },
];

const EDUCATION_LINKS: PatentinoLink[] = [
  {
    id: "edu-salute",
    title: "Scheda educativa — Ministero Salute",
    url: "https://www.salute.gov.it/portale/funghi/dettaglioContenutiFunghi.jsp?lingua=italiano&id=4241&area=funghi&menu=vuoto",
    kind: "education",
    description: "Materiali divulgativi ufficiali su raccolta sicura.",
  },
  {
    id: "edu-linee",
    title: "Linee guida raccolta responsabile",
    url: "https://www.salute.gov.it/portale/funghi",
    kind: "education",
    description: "Orari, contenitori, età minima, divieti comuni.",
  },
];

function reg(id: PatentinoRegionId): RegionalRegulation {
  return REGIONAL_REGULATIONS.find((r) => r.regionId === id)!;
}

export const PATENTINO_REGION_GUIDES: PatentinoRegionGuide[] = [
  {
    regionId: "campania",
    regionLabel: "Campania",
    badge: "Zona radar principale",
    intro:
      "In Campania la raccolta di funghi epigei è regolata dalla L.R. 8/2007. Serve il tesserino regionale (spesso chiamato «patentino»): senza non puoi raccogliere legalmente, salvo eccezioni previste dalla legge.",
    whoNeedsIt: [
      "Chiunque raccolga funghi epigei per uso personale (età minima 14 anni, accompagnato se minorenne).",
      "Non serve per sola osservazione fotografica senza raccolta.",
      "Attestato di qualifica di micologo abilitato può sostituire il colloquio per il rilascio.",
    ],
    steps: [
      {
        step: 1,
        title: "Studia la normativa",
        description:
          "Leggi L.R. Campania 8/2007 sul portale Funghi e Tartufi: limiti kg, orari (da 1h prima dell'alba a 1h dopo il tramonto), divieto rastrelli, contenitori traspiranti.",
      },
      {
        step: 2,
        title: "Scegli la via: colloquio o attestato",
        description:
          "Puoi ottenere il tesserino dopo colloquio abilitativo presso gli sportelli regionali, oppure presentando attestato di qualifica riconosciuto (corso micologo / qualifica professionale).",
      },
      {
        step: 3,
        title: "Prenota lo sportello",
        description:
          "Contatta URP / sportello Agricoltura Regione Campania o consulta funghietartufi.regione.campania.it per calendario colloqui e documenti da portare (identità, marca da bollo, moduli).",
      },
      {
        step: 4,
        title: "Sostieni il colloquio (se previsto)",
        description:
          "Colloquio su riconoscimento specie commestibili locali, regole di raccolta, sicurezza alimentare e tutela ambientale. Preparati con guide micologiche regionali.",
      },
      {
        step: 5,
        title: "Ritira il tesserino quinquennale",
        description:
          "Validità 5 anni. Portalo sempre durante la raccolta insieme a un documento d'identità.",
      },
      {
        step: 6,
        title: "Rinnova la convalida ogni anno",
        description:
          "Pagamento annuale €30 tramite PagoPA (codice tributo 1159) sul portale pagamenti Regione Campania, salvo esenzioni.",
      },
      {
        step: 7,
        title: "Controllo ASL prima del consumo",
        description:
          "Il tesserino autorizza a raccogliere, non certifica che ogni fungo sia commestibile. Porta sempre il raccolto al servizio micologico ASL.",
      },
    ],
    documents: [
      "Documento d'identità valido",
      "Modulo domanda (scaricabile dal portale regionale)",
      "Marca da bollo / versamenti se richiesti",
      "Attestato corso micologo (solo se percorso alternativo al colloquio)",
      "Fototessera (verifica sul modulo aggiornato)",
    ],
    costs: [
      "Rilascio tesserino: verifica importi vigenti sul portale (diritti di segreteria / bolli)",
      "Convalida annuale: €30/anno (PagoPA cod. 1159)",
      "Corsi micologici privati: variabili (opzionali, utili per preparazione)",
    ],
    renewal:
      "Ogni anno, entro le scadenze regionali, paga la convalida €30 su PagoPA. Il tesserino resta valido 5 anni se convalidato regolarmente.",
    limits: [
      "Max 3 kg/giorno per persona",
      "Max 1 kg complessivo tra Ovolo buono e Prugnolo",
      "Cappello minimo 3 cm (salvo eccezioni per specie concresciute)",
      "Cesto di vimini o carta — vietati sacchetti di plastica chiusi",
      "Vietati rastrelli e attrezzi che rovesciano la lettiera",
    ],
    regulation: reg("campania"),
    links: [...CAMPANIA_LINKS, ...EDUCATION_LINKS],
    faq: [
      {
        q: "Patentino e tesserino sono la stessa cosa?",
        a: "Nel linguaggio comune sì: in Campania si parla di tesserino regionale rilasciato dopo colloquio o attestato micologo.",
      },
      {
        q: "Posso raccogliere nel Sannio / Taburno / Matese?",
        a: "Sì con tesserino Campania valido, rispettando anche regolamenti di parchi e comuni. Verifica divieti locali.",
      },
      {
        q: "MushroomRadar sostituisce il colloquio?",
        a: "No. L'app aiuta a trovare zone e periodi favorevoli, ma non rilascia abilitazioni legali.",
      },
    ],
  },
  {
    regionId: "molise",
    regionLabel: "Molise",
    badge: "Matese · area radar",
    intro:
      "In Molise la raccolta è disciplinata dalla L.R. 23/1999 e successive modifiche. È richiesta autorizzazione/tesserino regionale; verifica sempre testo aggiornato e calendari sul portale regionale.",
    whoNeedsIt: [
      "Raccoglitori per uso personale nelle aree regionali",
      "Rispetto obbligatorio di parchi (es. Matese) e vincoli comunali",
    ],
    steps: [
      {
        step: 1,
        title: "Consulta la Regione Molise",
        description:
          "Accedi al portale istituzionale e cerca la sezione Agricoltura / raccolta funghi per moduli e sportelli.",
      },
      {
        step: 2,
        title: "Richiedi autorizzazione o tesserino",
        description:
          "Compila domanda con documenti richiesti (identità, eventuale attestato/colloquio secondo normativa vigente).",
      },
      {
        step: 3,
        title: "Rispetta limiti e orari",
        description:
          "Limite indicativo ~2 kg/giorno — conferma sul regolamento aggiornato. Raccolta diurna salvo diversa indicazione.",
      },
      {
        step: 4,
        title: "Controllo ASReM / micologo",
        description:
          "Prima del consumo, fai verificare il raccolto dal servizio sanitario competente.",
      },
    ],
    documents: [
      "Documento d'identità",
      "Modulo regionale aggiornato",
      "Eventuale attestato/corso se previsto dalla normativa",
    ],
    costs: [
      "Diritti di istruttoria: verifica sul portale Molise",
    ],
    renewal:
      "Verifica scadenze e rinnovi sul portale Regione Molise — possono variare per tipologia di autorizzazione.",
    limits: [
      "Circa 2 kg/giorno (conferma testo vigente)",
      "Vietati rastrelli",
      "Attenzione a aree protette del Matese",
    ],
    regulation: reg("molise"),
    links: [...MOLISE_LINKS, ...EDUCATION_LINKS],
    faq: [
      {
        q: "Il tesserino campano vale in Molise?",
        a: "No. Serve autorizzazione rilasciata dalla Regione Molise per raccogliere legalmente in Molise.",
      },
    ],
  },
  {
    regionId: "basilicata",
    regionLabel: "Basilicata",
    badge: "Area estesa radar",
    intro:
      "In Basilicata vale la L.R. 22/1999 per funghi epigei. Tesserino regionale obbligatorio; in Parco del Pollino possono applicarsi regole aggiuntive.",
    whoNeedsIt: [
      "Raccoglitori amatoriali per consumo personale",
      "Età minima e documenti come da regolamento ASP/Regione",
    ],
    steps: [
      {
        step: 1,
        title: "Portale Regione Basilicata",
        description:
          "Scarica modulistica e individua lo sportello competente per il tesserino.",
      },
      {
        step: 2,
        title: "Domanda e requisiti",
        description:
          "Presenta domanda con documenti e, se richiesto, certificazione/colloquio micologico.",
      },
      {
        step: 3,
        title: "Verifica parchi e comuni",
        description:
          "Pollino e altre aree protette possono limitare orari, quantità o accessi.",
      },
      {
        step: 4,
        title: "Controllo ASP",
        description:
          "Identificazione ufficiale del raccolto presso servizio micologico prima di cucinare.",
      },
    ],
    documents: [
      "Identità valida",
      "Modulo regionale",
      "Eventuale ricevuta diritti istruttoria",
    ],
    costs: [
      "Verifica tariffe vigenti sul portale regionale",
    ],
    renewal:
      "Controlla scadenza tesserino e procedure di rinnovo sulla Regione Basilicata.",
    limits: [
      "Circa 3 kg/giorno su base regionale",
      "Cesto traspirante",
      "Regolamenti Parco del Pollino",
    ],
    regulation: reg("basilicata"),
    links: [...BASILICATA_LINKS, ...EDUCATION_LINKS],
    faq: [
      {
        q: "Posso usare MushroomRadar nel Pollino?",
        a: "Sì per orientamento meteo/zone, ma rispetta sempre regolamento parco e tesserino basilicata.",
      },
    ],
  },
];

export function getPatentinoGuide(
  regionId: PatentinoRegionId
): PatentinoRegionGuide {
  return (
    PATENTINO_REGION_GUIDES.find((g) => g.regionId === regionId) ??
    PATENTINO_REGION_GUIDES[0]
  );
}

export const LINK_KIND_LABELS: Record<PatentinoLink["kind"], string> = {
  official: "Ufficiale",
  law: "Normativa",
  asl: "ASL / Sanità",
  education: "Didattica",
  payment: "Pagamenti",
};

export const LINK_KIND_COLORS: Record<PatentinoLink["kind"], string> = {
  official: "text-sky-300 border-sky-500/30 bg-sky-950/30",
  law: "text-amber-200 border-amber-500/30 bg-amber-950/25",
  asl: "text-emerald-300 border-emerald-500/30 bg-emerald-950/25",
  education: "text-violet-200 border-violet-500/30 bg-violet-950/25",
  payment: "text-mushroom-200 border-mushroom-500/30 bg-mushroom-950/25",
};
