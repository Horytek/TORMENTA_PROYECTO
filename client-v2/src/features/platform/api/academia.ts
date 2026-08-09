import { createProductClient } from "./createProductClient";

const adminApi = createProductClient("horytek_academia_admin_token");
const alumnoApi = createProductClient("horytek_academia_alumno_token");

export const getAcademiaAdminToken = adminApi.getToken;
export const setAcademiaAdminToken = adminApi.setToken;
export const getAcademiaAlumnoToken = alumnoApi.getToken;
export const setAcademiaAlumnoToken = alumnoApi.setToken;

/** @deprecated */
export function getAcademiaToken() {
  return getAcademiaAdminToken() || getAcademiaAlumnoToken();
}
/** @deprecated */
export function setAcademiaToken(token: string | null) {
  setAcademiaAdminToken(token);
}

export async function bootstrapAcademia(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
  plan?: string;
}) {
  const { data } = await adminApi.client.post("/academia/bootstrap", body);
  return data;
}

export async function loginAcademiaAdmin(body: {
  slug: string;
  email: string;
  password: string;
}) {
  const { data } = await adminApi.client.post("/academia/auth/admin", body);
  if (data?.success && data?.data?.token) {
    setAcademiaAdminToken(data.data.token);
    setAcademiaAlumnoToken(null);
  }
  return data;
}

export async function loginAcademiaAlumno(body: {
  slug: string;
  email: string;
  password: string;
  nombre?: string;
}) {
  const { data } = await alumnoApi.client.post("/academia/auth/alumno", body);
  if (data?.success && data?.data?.token) {
    setAcademiaAlumnoToken(data.data.token);
    setAcademiaAdminToken(null);
  }
  return data;
}

export async function getAcademiaPortal(slug: string) {
  const { data } = await adminApi.client.get(`/academia/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listAcademiaCursos() {
  const { data } = await adminApi.client.get("/academia/admin/cursos");
  return data;
}

export async function createAcademiaCurso(body: {
  titulo: string;
  descripcion?: string;
}) {
  const { data } = await adminApi.client.post("/academia/admin/cursos", body);
  return data;
}

export async function listAcademiaAlumnos() {
  const { data } = await adminApi.client.get("/academia/admin/alumnos");
  return data;
}

export async function createAcademiaAlumno(body: {
  email: string;
  nombre: string;
  password: string;
}) {
  const { data } = await adminApi.client.post("/academia/admin/alumnos", body);
  return data;
}

export async function inscribirAcademia(body: { id_curso: number; id_alumno: number }) {
  const { data } = await adminApi.client.post("/academia/admin/inscripciones", body);
  return data;
}

export async function listAcademiaInscripciones() {
  const { data } = await adminApi.client.get("/academia/admin/inscripciones");
  return data;
}

/** Portal público ya trae cursos; alumno usa portal + inscripciones del admin seed. */
export async function misCursosAcademia(slug: string) {
  const { data } = await alumnoApi.client.get(`/academia/portal/${encodeURIComponent(slug)}`);
  return data;
}
