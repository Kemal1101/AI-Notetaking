interface Config {
    apiBaseUrl: string
}

export const Config: Config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
}