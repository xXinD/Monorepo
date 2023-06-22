type ResponseFormat = "json" | "text" | "blob" | "formData";

export class Fetch {
  baseURL: string;

  constructor(baseURL: string = "http://localhost") {
    this.baseURL = baseURL;
  }

  async parseResponse(response: Response, format: ResponseFormat) {
    if (format === "json") {
      return await response.json();
    }
    if (format === "text") {
      return await response.text();
    }
    if (format === "blob") {
      return await response.blob();
    }
    if (format === "formData") {
      return await response.formData();
    }
    return await response.json();
  }

  get(endpoint: string, format: ResponseFormat = "json") {
    return fetch(`${this.baseURL}${endpoint}`).then((response) =>
      this.parseResponse(response, format)
    );
  }

  post(endpoint: string, body: any, format: ResponseFormat = "json") {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => this.parseResponse(response, format));
  }

  delete(endpoint: string, format: ResponseFormat = "json") {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
    }).then((response) => this.parseResponse(response, format));
  }

  put(endpoint: string, body: any, format: ResponseFormat = "json") {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => this.parseResponse(response, format));
  }

  patch(endpoint: string, body: any, format: ResponseFormat = "json") {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => this.parseResponse(response, format));
  }
}

export const FetchInstance = new Fetch();
