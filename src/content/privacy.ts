export type PrivacyLocale = 'it' | 'en';

export interface PrivacySection {
    title: string;
    paragraphs: string[];
    bullets?: string[];
    closing?: string[];
    links?: { label: string; href: string }[];
}

export interface PrivacyCopy {
    documentTitle: string;
    legalRef: string;
    lastUpdatedLabel: string;
    lastUpdatedValue: string;
    switchLabel: string;
    backToTracker: string;
    sections: PrivacySection[];
}

export const privacyCopy: Record<PrivacyLocale, PrivacyCopy> = {
    it: {
        documentTitle: 'Informativa sulla privacy',
        legalRef: 'ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (“GDPR”)',
        lastUpdatedLabel: 'Ultimo aggiornamento',
        lastUpdatedValue: '18 settembre 2026',
        switchLabel: 'Lingua',
        backToTracker: 'Torna al tracker',
        sections: [
            {
                title: '1. Premessa',
                paragraphs: [
                    'Starmonitor (https://starmonitor.vercel.app) è un visualizzatore 3D dei satelliti Starlink in orbita attorno alla Terra, realizzato da Antonio Santese (Asyntes). Questa informativa descrive quali dati personali possono essere trattati quando si visita il sito e con quali modalità.',
                    'Il sito non richiede registrazione, non dispone di account utente, non include moduli di contatto e non effettua profilazione commerciale.',
                ],
            },
            {
                title: '2. Titolare del trattamento',
                paragraphs: [
                    'Il titolare del trattamento è Antonio Santese, che opera con il nome Asyntes, con sede in Italia.',
                ],
                bullets: [
                    'Sito del titolare: https://asyntes.com',
                    'Repository del progetto: https://github.com/asyntes/starmonitor',
                ],
                closing: [
                    'Per domande su questa informativa o per esercitare i diritti previsti dal GDPR è possibile contattare il titolare tramite il sito asyntes.com oppure aprendo una segnalazione sul repository GitHub del progetto.',
                ],
            },
            {
                title: '3. Quali dati sono trattati',
                paragraphs: [
                    'Starmonitor non raccoglie anagrafiche, indirizzi e-mail, credenziali, pagamenti né la posizione GPS del dispositivo.',
                    'Possono essere trattati, in modo automatico e nei limiti di quanto necessario al funzionamento del servizio:',
                ],
                bullets: [
                    'dati tecnici di navigazione (indirizzo IP, user agent, data e ora della richiesta, URL richiesto, codice di risposta), registrati dal fornitore di hosting per erogare, proteggere e diagnosticare il sito;',
                    'l’indirizzo IP e dati tecnici analoghi trasmessi a CelesTrak quando il browser richiede i dati orbitali (TLE) dei satelliti Starlink, operazione indispensabile per calcolare e mostrare le posizioni in tempo reale.',
                ],
                closing: [
                    'I dati sulla disponibilità del servizio Starlink e i confini geografici sono caricati da file statici ospitati sullo stesso sito: in produzione non vengono inviate richieste a terzi per queste mappe.',
                ],
            },
            {
                title: '4. Finalità e base giuridica',
                paragraphs: [
                    'I dati indicati al punto 3 sono trattati esclusivamente per:',
                ],
                bullets: [
                    'erogare il visualizzatore 3D e aggiornare le posizioni satellitari richieste dall’utente (art. 6, par. 1, lett. b) GDPR e, in subordine, art. 6, par. 1, lett. f) GDPR);',
                    'garantire sicurezza, stabilità e diagnosi tecniche del sito (art. 6, par. 1, lett. f) GDPR — legittimo interesse del titolare).',
                ],
                closing: [
                    'Non vengono svolte attività di marketing, profilazione, osservazione del comportamento dell’utente o vendita di dati a terzi.',
                ],
            },
            {
                title: '5. Destinatari',
                paragraphs: [
                    'Oltre al titolare, possono trattare dati tecnici:',
                ],
                bullets: [
                    'Vercel Inc., fornitore di hosting e rete di distribuzione dei contenuti del sito, in qualità di responsabile del trattamento;',
                    'CelesTrak (celestrak.org), che riceve la richiesta dei dati TLE direttamente dal browser dell’utente e tratta tali dati tecnici come titolare autonomo.',
                ],
                closing: [
                    'I dati non sono oggetto di diffusione e non sono comunicati a terzi per finalità commerciali.',
                ],
            },
            {
                title: '6. Trasferimenti extra-UE',
                paragraphs: [
                    'Vercel e CelesTrak possono trattare dati tecnici negli Stati Uniti o in altri Paesi extra SEE.',
                    'Per Vercel il trasferimento avviene sulla base delle Clausole Contrattuali Standard e delle misure descritte nella relativa documentazione privacy. La comunicazione a CelesTrak è limitata a quanto tecnicamente necessario per ottenere i dati orbitali pubblici e consentire il funzionamento del tracker.',
                ],
                links: [
                    { label: 'Informativa privacy di Vercel', href: 'https://vercel.com/legal/privacy-policy' },
                    { label: 'CelesTrak', href: 'https://celestrak.org' },
                ],
            },
            {
                title: '7. Conservazione',
                paragraphs: [
                    'Il sito non memorizza dati personali in database propri, né in cookie o archivi locali dell’applicazione.',
                    'I log tecnici sono conservati dal fornitore di hosting per il tempo strettamente necessario alle finalità di sicurezza e operatività, secondo le rispettive politiche.',
                ],
            },
            {
                title: '8. Cookie e tracciamento',
                paragraphs: [
                    'Starmonitor non utilizza cookie di profilazione, cookie analitici di prima parte, pixel pubblicitari, fingerprinting o altri strumenti di tracciamento del comportamento.',
                    'Non è presente un banner cookie perché il sito non installa cookie che richiedono il consenso ai sensi della normativa ePrivacy.',
                    'Eventuali cookie strettamente tecnici eventualmente impostati dall’infrastruttura di hosting sono limitati al funzionamento della rete di distribuzione dei contenuti.',
                ],
            },
            {
                title: '9. Diritti dell’interessato',
                paragraphs: [
                    'L’interessato può esercitare, nei limiti previsti dalla legge, i diritti di cui agli articoli 15-22 del GDPR: accesso, rettifica, cancellazione, limitazione, opposizione, portabilità, nonché revoca del consenso ove il trattamento si basi sul consenso. Nel caso di Starmonitor il trattamento non si basa sul consenso.',
                    'È inoltre possibile proporre reclamo al Garante per la protezione dei dati personali.',
                ],
                links: [
                    { label: 'Garante per la protezione dei dati personali', href: 'https://www.garanteprivacy.it' },
                ],
            },
            {
                title: '10. Minori',
                paragraphs: [
                    'Il sito non è destinato alla raccolta di dati di minori e non richiede informazioni identificative. I contenuti sono una visualizzazione tecnica di dati orbitali pubblici.',
                ],
            },
            {
                title: '11. Modifiche',
                paragraphs: [
                    'Questa informativa può essere aggiornata in caso di modifiche al sito, ai servizi utilizzati o alla normativa applicabile. La data di ultimo aggiornamento è indicata in cima alla pagina. Si invita a consultare periodicamente questa pagina.',
                ],
            },
        ],
    },
    en: {
        documentTitle: 'Privacy policy',
        legalRef: 'pursuant to Articles 13 and 14 of Regulation (EU) 2016/679 (“GDPR”)',
        lastUpdatedLabel: 'Last updated',
        lastUpdatedValue: '18 September 2026',
        switchLabel: 'Language',
        backToTracker: 'Back to tracker',
        sections: [
            {
                title: '1. Introduction',
                paragraphs: [
                    'Starmonitor (https://starmonitor.vercel.app) is a 3D viewer of Starlink satellites orbiting Earth, built by Antonio Santese (Asyntes). This notice explains which personal data may be processed when you visit the site and how that processing takes place.',
                    'The site does not require registration, has no user accounts, includes no contact forms, and does not carry out commercial profiling.',
                ],
            },
            {
                title: '2. Data controller',
                paragraphs: [
                    'The data controller is Antonio Santese, operating as Asyntes, based in Italy.',
                ],
                bullets: [
                    'Controller website: https://asyntes.com',
                    'Project repository: https://github.com/asyntes/starmonitor',
                ],
                closing: [
                    'For questions about this notice or to exercise GDPR rights, you can contact the controller via asyntes.com or by opening an issue on the project’s GitHub repository.',
                ],
            },
            {
                title: '3. What data is processed',
                paragraphs: [
                    'Starmonitor does not collect identity details, email addresses, credentials, payments, or the device’s GPS location.',
                    'The following may be processed automatically, and only as needed to operate the service:',
                ],
                bullets: [
                    'technical browsing data (IP address, user agent, date and time of the request, requested URL, response code), recorded by the hosting provider to deliver, protect, and diagnose the site;',
                    'the IP address and similar technical data sent to CelesTrak when the browser requests Starlink orbital (TLE) data, which is required to calculate and display live satellite positions.',
                ],
                closing: [
                    'Starlink service-availability data and geographic borders are loaded from static files hosted on this site: in production no third-party requests are made for those maps.',
                ],
            },
            {
                title: '4. Purposes and legal bases',
                paragraphs: [
                    'The data described in section 3 is processed only to:',
                ],
                bullets: [
                    'provide the 3D viewer and update the satellite positions you request (GDPR Art. 6(1)(b) and, subsidiarily, Art. 6(1)(f));',
                    'keep the site secure, stable, and diagnosable (GDPR Art. 6(1)(f) — legitimate interest of the controller).',
                ],
                closing: [
                    'There is no marketing, profiling, behavioural observation, or sale of data to third parties.',
                ],
            },
            {
                title: '5. Recipients',
                paragraphs: [
                    'In addition to the controller, technical data may be processed by:',
                ],
                bullets: [
                    'Vercel Inc., the site’s hosting and content-delivery provider, acting as a processor;',
                    'CelesTrak (celestrak.org), which receives the TLE request directly from your browser and processes that technical data as an independent controller.',
                ],
                closing: [
                    'Data is not disclosed to the public and is not shared with third parties for commercial purposes.',
                ],
            },
            {
                title: '6. Transfers outside the EU',
                paragraphs: [
                    'Vercel and CelesTrak may process technical data in the United States or other countries outside the EEA.',
                    'Transfers to Vercel rely on Standard Contractual Clauses and the safeguards described in Vercel’s privacy documentation. Communication to CelesTrak is limited to what is technically necessary to obtain public orbital data and operate the tracker.',
                ],
                links: [
                    { label: 'Vercel privacy policy', href: 'https://vercel.com/legal/privacy-policy' },
                    { label: 'CelesTrak', href: 'https://celestrak.org' },
                ],
            },
            {
                title: '7. Retention',
                paragraphs: [
                    'The site does not store personal data in its own databases, cookies, or application-level local storage.',
                    'Technical logs are retained by the hosting provider for no longer than needed for security and operations, according to that provider’s policies.',
                ],
            },
            {
                title: '8. Cookies and tracking',
                paragraphs: [
                    'Starmonitor does not use profiling cookies, first-party analytics cookies, advertising pixels, fingerprinting, or other behavioural tracking tools.',
                    'There is no cookie banner because the site does not set cookies that require consent under ePrivacy rules.',
                    'Any strictly technical cookies that the hosting infrastructure may set are limited to operating the content-delivery network.',
                ],
            },
            {
                title: '9. Your rights',
                paragraphs: [
                    'You may exercise, within the limits of the law, the rights in GDPR Articles 15–22: access, rectification, erasure, restriction, objection, portability, and withdrawal of consent where processing is based on consent. Starmonitor’s processing is not based on consent.',
                    'You may also lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali).',
                ],
                links: [
                    { label: 'Italian Data Protection Authority', href: 'https://www.garanteprivacy.it' },
                ],
            },
            {
                title: '10. Children',
                paragraphs: [
                    'The site is not intended to collect children’s data and does not ask for identifying information. Its content is a technical visualisation of public orbital data.',
                ],
            },
            {
                title: '11. Changes',
                paragraphs: [
                    'This notice may be updated if the site, the services it uses, or applicable law change. The last-updated date is shown at the top of this page. Please review this page periodically.',
                ],
            },
        ],
    },
};
