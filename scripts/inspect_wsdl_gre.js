const url = process.argv[2] || 'https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/despatchService?wsdl';

(async () => {
  const r = await fetch(url);
  const status = r.status;
  const contentType = r.headers.get('content-type');
  const contentLength = r.headers.get('content-length');
  const t = await r.text();
  const opMatches = [...t.matchAll(/<wsdl:operation[^>]*name="([^"]+)"/g)].map((x) => x[1]);
  const ops = [...new Set(opMatches)];
  const addr = [...t.matchAll(/soap11:address location="([^"]+)"/g)].map((x) => x[1]);
  console.log(
    JSON.stringify(
      {
        url,
        status,
        contentType,
        contentLength,
        length: t.length,
        ops,
        addr,
      },
      null,
      2
    )
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
