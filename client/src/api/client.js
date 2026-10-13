import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// TODO: request interceptor -> attach access token (Authorization: Bearer ...)
// TODO: response interceptor -> on 401, call /auth/refresh once, then retry the request

export function getErrorMessage(err) {
  return err?.response?.data?.message ?? err?.message ?? 'Something went wrong';
}
