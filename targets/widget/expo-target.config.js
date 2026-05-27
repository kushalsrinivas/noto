/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  icon: "../../assets/images/icon.png",
  deploymentTarget: "17.0",
  colors: {
    $accent: "#E8590C",
    $widgetBackground: "#FAFAF7",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.kushalbhai.noto"],
  },
};
