const codes = ["DE", "FR", "IT", "ES", "GB", "PL"];
const countryUrl = `https://api.worldbank.org/v2/country/${codes.join(";")}?format=json&per_page=100`;
const response = await fetch(countryUrl);
console.log("HTTP", response.status);
if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}
const json = await response.json();
const rows = json[1] ?? [];
console.log(
  rows.map((row) => ({
    code: row.id,
    name: row.name,
    capital: row.capitalCity,
    region: row.region?.value,
    income: row.incomeLevel?.value,
  })),
);

for (const indicator of ["SP.POP.TOTL", "AG.SRF.TOTL.K2"]) {
  const url = `https://api.worldbank.org/v2/country/${codes.join(";")}/indicator/${indicator}?format=json&per_page=100&date=2023`;
  const res = await fetch(url);
  const data = await res.json();
  const values = (data[1] ?? [])
    .filter((row) => row.value !== null)
    .map((row) => ({
      code: row.countryiso3code,
      date: row.date,
      value: row.value,
    }));
  console.log(indicator, values);
}
