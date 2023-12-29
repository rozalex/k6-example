const Userlogin = "eva";
const Password = "1";

export const properties = {
    ApplicationName: "APP001",
    Debug: false,
    Dname: "test",
    Language: 3,
    PluginEnabled: false,
    Tabulaini: "tabdev.ini",
    TenantID: "",
    Userlogin,

    Credentials: {
      Simple: {
        Userlogin,
        Password
      },
    },
    Timezone: {
      Diff: 180,
      IANA: "Asia/Jerusalem",
    },
};