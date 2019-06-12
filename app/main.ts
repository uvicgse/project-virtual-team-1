import { bootstrap }    from "@angular/platform-browser-dynamic";
import { AppComponent } from "./components/app/app.component";
import { AuthenticateComponent} from "./components/authenticate/authenticate.component";
bootstrap(AppComponent);

//creating dummy error so that tsc warning wont show up
generateDummyError(