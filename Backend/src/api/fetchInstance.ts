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
        Cookie:
          "buvid3=9DD10953-5086-1F7D-9CDB-6524720127F167283infoc; i-wanna-go-back=-1; _uuid=48BC4462-B81C-1A710-88E2-109B829849D4666500infoc; nostalgia_conf=-1; CURRENT_PID=8d877350-dc42-11ed-ba13-25d169ca44d4; rpdid=|(u)~lJ|YRJ)0J'uY)uYRuJmJ; LIVE_BUVID=AUTO8916817429368701; buvid_fp_plain=undefined; hit-new-style-dyn=1; hit-dyn-v2=1; is-2022-channel=1; dy_spec_agreed=1; CURRENT_BLACKGAP=0; home_feed_column=5; header_theme_version=CLOSE; CURRENT_QUALITY=120; bp_video_offset_393312118=805440491241865200; fingerprint=474630d8cd110304be2f5723d10e6f02; bp_video_offset_39569895=806661250059599900; browser_resolution=2048-1051; FEED_LIVE_VERSION=V8; b_nut=1687076600; b_ut=5; bp_video_offset_3493286020909353=809986168925978600; Hm_lvt_8a6e55dbd2870f0f5bc9194cddf32a02=1687512455; CURRENT_FNVAL=4048; bp_video_offset_3493290051636127=810357254101401600; innersign=0; bsource=search_baidu; SESSDATA=d87f709e%2C1703149464%2C726d7%2A62R-RfG-7FGnHp2tgcA5eFuXnoEyySRJX6b2K_7WHyJIlgFNkdMN63ZOu2jzHPKBDUHtZHuAAAGwA; bili_jct=5ab5fdb5e24401806a420e5df9ab34c4; DedeUserID=3493290051636127; DedeUserID__ckMd5=78b8a95618fc77dc; sid=ndbiyj6b; PEA_AU=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiaWQiOjM0OTMyOTAwNTE2MzYxMjcsInBpZCI6MjY4MTkxNiwiZXhwIjoxNzE5MTMzNzQ5LCJpc3MiOiJ0ZXN0In0.cZFAbEgPm4cNQtVr-98WNlE9AU4JvGKuRFNxTGX1RAM; buvid_fp=474630d8cd110304be2f5723d10e6f02; b_lsid=3EA4E9EC_188EE231176; _dfcaptcha=b2b0df259879fcff1c3393f23f404e8a; PVID=2; buvid4=27F33918-C640-A198-6221-F4DC4CAD176A68046-023041618-+pjFieaAYd5GrxDdXxdZpg%3D%3D",
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

export const FetchClass = Fetch;
export const FetchInstance = new Fetch();
