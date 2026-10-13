import { DEFAULT_LOCALE } from "@/lib/types";

const target = `/${DEFAULT_LOCALE}/`;

/** Static hosts can't do server redirects reliably, so redirect with a meta refresh + script. */
export default function RootPage() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(target)})` }} />
      <p style={{ padding: 24 }}>
        <a href={target}>سيريافليكس — SyriaFlix</a>
      </p>
    </>
  );
}
