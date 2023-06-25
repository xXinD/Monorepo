type ResponseFormat = "json" | "text" | "blob" | "formData";
type BodyFormat = "json" | "urlencoded";

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

  formatBody(
    body: any,
    format: BodyFormat
  ): { headers: { "Content-Type": string }; body: string } {
    if (format === "json") {
      return {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    }
    if (format === "urlencoded") {
      return {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: this.objectToUrlEncoded(body),
      };
    }
    return {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }

  objectToUrlEncoded(obj: any) {
    return Object.keys(obj)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
      )
      .join("&");
  }

  get(
    endpoint: string,
    params: any = {},
    format: ResponseFormat = "json",
    headerConfig: any = {}
  ) {
    const url = Object.keys(params).length
      ? `${this.baseURL}${endpoint}?this.objectToUrlEncoded(params)`
      : `${this.baseURL}${endpoint}`;
    return fetch(url, {
      method: "GET",
      headers: {
        ...headerConfig,
      },
    }).then((response) => this.parseResponse(response, format));
  }

  post(
    endpoint: string,
    body: any,
    bodyFormat: BodyFormat = "json",
    responseFormat: ResponseFormat = "json",
    headerConfig: any = {}
  ) {
    const { headers, body: formattedBody } = this.formatBody(body, bodyFormat);
    return fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: {
        ...headers,
        ...headerConfig,
      },
      body: formattedBody,
    }).then((response) => this.parseResponse(response, responseFormat));
  }

  delete(endpoint: string, format: ResponseFormat = "json") {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
    }).then((response) => this.parseResponse(response, format));
  }

  put(
    endpoint: string,
    body: any,
    bodyFormat: BodyFormat = "json",
    responseFormat: ResponseFormat = "json"
  ) {
    const { headers, body: formattedBody } = this.formatBody(body, bodyFormat);

    return fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers,
      body: formattedBody,
    }).then((response) => this.parseResponse(response, responseFormat));
  }

  patch(
    endpoint: string,
    body: any,
    bodyFormat: BodyFormat = "json",
    responseFormat: ResponseFormat = "json",
    headerConfig: any = {}
  ) {
    const { headers, body: formattedBody } = this.formatBody(body, bodyFormat);

    return fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      headers: {
        ...headers,
        ...headerConfig,
      },
      body: formattedBody,
    }).then((response) => this.parseResponse(response, responseFormat));
  }
}

export const FetchClass = Fetch;
export const FetchInstance = new Fetch();
