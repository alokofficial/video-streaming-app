import { google } from "googleapis";

import path from "path";

import { fileURLToPath } from "url";


const __filename = fileURLToPath(
  import.meta.url
);

const __dirname = path.dirname(
  __filename
);


let auth;


// Use ENV variables if available
if (process.env.GOOGLE_PRIVATE_KEY) {

  auth = new google.auth.GoogleAuth({

    credentials: {

      type: "service_account",

      project_id:
        process.env.GOOGLE_PROJECT_ID,

      private_key_id:
        process.env.GOOGLE_PRIVATE_KEY_ID,

      private_key:
        process.env.GOOGLE_PRIVATE_KEY.replace(
          /\\n/g,
          "\n"
        ),

      client_email:
        process.env.GOOGLE_CLIENT_EMAIL,

      client_id:
        process.env.GOOGLE_CLIENT_ID,
    },

    scopes: [
      "https://www.googleapis.com/auth/drive",
    ],
  });

} else {

  // Local JSON credentials fallback

  auth = new google.auth.GoogleAuth({

    keyFile: path.join(
      __dirname,
      "../credentials/google-drive.json"
    ),

    scopes: [
      "https://www.googleapis.com/auth/drive",
    ],
  });
}


const driveService = google.drive({
  version: "v3",
  auth,
});

export default driveService;