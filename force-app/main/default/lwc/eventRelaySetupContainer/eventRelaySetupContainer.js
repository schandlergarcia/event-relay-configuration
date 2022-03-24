import { LightningElement } from "lwc";

export default class EventRelaySetupContainer extends LightningElement {
  navItems = [{name:"home", label:"Home"},{name:"named-credentials", label:"Named Credentials"},{name:"event-relay-channels", label:"Platform Event Channels"},{name:"event-relay-channel-members", label:"Platform Event Channel Members"}, {name:"setup",label:"Setup"}];
  selectedNavItem = 'setup';
  handleNavSelect(event) {
    this.selectedNavItem = event.detail;
    console.log(event.detail);
  }
}
