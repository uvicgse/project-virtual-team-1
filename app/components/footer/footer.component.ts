import { Component, Directive } from "@angular/core";
import { StashPanelComponent } from "../stashPanel/stash.panel.component";

@Component({
  selector: "app-footer",
  templateUrl: 'app/components/footer/footer.component.html',
  directives: [StashPanelComponent,]
})

export class FooterComponent {

}
