// Função utilitária para retornar os feriados nacionais do Brasil em formato yyyy-mm-dd
// Inclui feriados fixos e móveis (Páscoa, Carnaval, Corpus Christi)

function pad(n) { return n < 10 ? '0' + n : n; }

function getEaster(year) {
  // Algoritmo de Meeus/Jones/Butcher
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

export function getFeriadosNacionais(year) {
  const easter = getEaster(year);
  const feriadosFixos = [
    `${year}-01-01`, // Confraternização Universal
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Dia do Trabalho
    `${year}-09-07`, // Independência
    `${year}-10-12`, // N. Sra. Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-12-25`, // Natal
  ];
  // Feriados móveis
  const pascoa = easter;
  const carnaval = new Date(easter); carnaval.setDate(pascoa.getDate() - 47);
  const sextaSanta = new Date(easter); sextaSanta.setDate(pascoa.getDate() - 2);
  const corpusChristi = new Date(easter); corpusChristi.setDate(pascoa.getDate() + 60);
  const feriadosMoveis = [carnaval, sextaSanta, pascoa, corpusChristi].map(d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  return [...feriadosFixos, ...feriadosMoveis];
}
