import App from "./app";
import { port } from "./config";
const appInstance = new App();
appInstance.listen(port);