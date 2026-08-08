import { createProductClient } from "./createProductClient";

const { client, getToken, setToken } = createProductClient("horytek_academia_token");

export { getToken as getAcademiaToken, setToken as setAcademiaToken };

export async function bootstrapAcademia(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/academia/bootstrap", body);
  return data;
}

export async function loginAcademiaAdmin(body: {
  slug: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/academia/auth/admin", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function loginAcademiaAlumno(body: {
  slug: string;
  email: string;
  password: string;
  nombre?: string;
}) {
  const { data } = await client.post("/academia/auth/alumno", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function getAcademiaPortal(slug: string) {
  const { data } = await client.get(`/academia/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listAcademiaCursos() {
  const { data } = await client.get("/academia/cursos");
  return data;
}

export async function createAcademiaCurso(body: {
  titulo: string;
  descripcion?: string;
}) {
  const { data } = await client.post("/academia/cursos", body);
  return data;
}

export async function listAcademiaAlumnos() {
  const { data } = await client.get("/academia/alumnos");
  return data;
}

export async function createAcademiaAlumno(body: {
  email: string;
  nombre: string;
  password: string;
}) {
  const { data } = await client.post("/academia/alumnos", body);
  return data;
}

export async function inscribirAcademia(body: { id_curso: number; id_alumno: number }) {
  const { data } = await client.post("/academia/inscripciones", body);
  return data;
}

export async function misCursosAcademia() {
  const { data } = await client.get("/academia/me/cursos");
  return data;
}
