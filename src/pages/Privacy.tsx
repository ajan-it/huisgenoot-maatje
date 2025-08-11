import { Helmet } from "react-helmet-async";

const Privacy = () => {
  return (
    <main className="min-h-screen container py-12">
      <Helmet>
        <title>Privacybeleid – Eerlijke huishoudplanner</title>
        <meta name="description" content="Privacybeleid: we gebruiken gegevens alleen om klussen in te plannen en herinneringen te sturen. GDPR-conform, EU-datacenters." />
        <link rel="canonical" href="/privacy" />
      </Helmet>
      <article className="prose prose-neutral max-w-2xl">
        <h1>Privacybeleid</h1>
        <p>
          Wij minimaliseren persoonsgegevens: alleen voornamen en contactgegevens voor herinneringen. Gegevens worden uitsluitend gebruikt om
          huishoudtaken te plannen en herinneringen via e-mail of WhatsApp/SMS te sturen. We gebruiken geen gegevens voor reclame of profilering.
        </p>
        <h2>Jouw rechten</h2>
        <ul>
          <li>Je kunt je gegevens op elk moment inzien, aanpassen of verwijderen.</li>
          <li>Data wordt opgeslagen in EU-datacenters.</li>
          <li>Plannen ouder dan 12 maanden worden automatisch verwijderd.</li>
        </ul>
        <p>
          Voor berichten via WhatsApp gebruiken we goedgekeurde sjablonen en vragen we expliciete toestemming. Vragen? Neem contact op via privacy@voorbeeld.nl.
        </p>
      </article>
    </main>
  );
};

export default Privacy;
