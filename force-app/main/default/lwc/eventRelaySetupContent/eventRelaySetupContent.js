import { LightningElement, api, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { subscribe } from "lightning/empApi";
import getNamedCredentials from "@salesforce/apex/EventRelayController.getNamedCredentials";
import getPlatformEventChannels from "@salesforce/apex/EventRelayController.getPlatformEventChannels";
import getPlatformEventChannelMembers from "@salesforce/apex/EventRelayController.getPlatformEventChannelMembers";
import getEventDefinitions from "@salesforce/apex/EventRelayController.getEventDefinitions";
import getEventRelayConfig from "@salesforce/apex/EventRelayController.getEventRelayConfig";
import updateConfigStatus from "@salesforce/apex/EventRelayController.updateConfigStatus";

const actions = [{ label: "Show details", name: "show_details" }];
const configActions = [{ label: "Activate", name: "RUN" },{ label: "Pause", name: "PAUSE" },{ label: "Stop", name: "STOP" },{ label: "Show details", name: "show_details" }];

const namedCredentialColumns = [
  { label: "Label", fieldName: "MasterLabel", wrapText: true },
  { label: "Developer Name", fieldName: "DeveloperName", wrapText: true },
  { label: "Endpoint", fieldName: "Endpoint" },
  { label: "Region", fieldName: "Region" },
  { label: "Account Number", fieldName: "AccountNumber" },
  {
    type: "action",
    typeAttributes: { rowActions: actions }
  }
];

const platformEventChannelColumns = [
  { label: "Label", fieldName: "MasterLabel", wrapText: true },
  { label: "Developer Name", fieldName: "DeveloperName", wrapText: true },
  {
    type: "action",
    typeAttributes: { rowActions: actions }
  }
];

const platformEventChannelMemberColumns = [
  { label: "Developer Name", fieldName: "DeveloperName", wrapText: true },
  { label: "Event Channel", fieldName: "EventChannel", wrapText: true },
  { label: "Selected Entity", fieldName: "SelectedEntity", wrapText: true },
  {
    type: "action",
    typeAttributes: { rowActions: actions }
  }
];

const eventRelayConfigColumns = [
  { label: "Label", fieldName: "MasterLabel", wrapText: true },
  { label: "Developer Name", fieldName: "DeveloperName", wrapText: true },
  {
    label: 'Status',
    fieldName: 'Status',
    cellAttributes: {
        class: { fieldName: 'Style' },
    },
},
{ label: "Event Channel", fieldName: "EventChannelName", wrapText: true },
  {
    label: "Named Credential",
    fieldName: "DestinationResourceName",
    wrapText: true
  },
  {
    type: "action",
    typeAttributes: { rowActions: configActions }
  }
];
export default class EventRelaySetupContent extends NavigationMixin(LightningElement) {
  @api selectedNavItem = 'setup';
  loading = false;
  configurations = [];
  modalState = "edit";

  // Setup
  setupStep = 1;

  //Emp API
  channelName = "/event/EventRelaySetup__e";
  subscription = {};

  //Named Credentials
  @track namedCredentials = [];
  namedCredentialColumns = namedCredentialColumns;
  showNamedCredentialModal = false;
  selectedNamedCredential;

  //Platform Event Channel
  platformEventChannelColumns = platformEventChannelColumns;
  showPlatformEventChannelModal = false;
  @track platformEventChannels = [];

  //Platform Event Channel Members
  platformEventChannelMemberColumns = platformEventChannelMemberColumns;
  showPlatformEventChannelMemberModal = false;
  @track platformEventChannelMembers = [];

  //Event Relay Configuration
  @track eventRelayConfigs = [];
  eventRelayConfigColumns = eventRelayConfigColumns;
  showEventRelayConfigModal = false;
  eventRelayConfigLoading = true;

  //Event Definitions
  @track eventDefinitions = [];

  //Error Handling
  error;
  messageType;
  showMessage = false;

  connectedCallback() {
    this.getNamedCredentials();
    this.getPlatformEventChannels();
    this.getEventDefinitions();
    this.handleSubscribe();
    this.getEventRelayConfig();
  }

  handleSubscribe() {
    const messageCallback = function (response) {
      this.parseResponse(response);
    };
    subscribe(this.channelName, -1, messageCallback.bind(this)).then(
      (response) => {
        console.log(
          "Subscription request sent to: ",
          JSON.stringify(response.channel)
        );
        this.subscription = response;
      }
    );
  }

  getNamedCredentials() {
    getNamedCredentials()
      .then((data) => {
        if (data) {
          this.namedCredentials = this.formatNamedCredentials(data);
          this.stopLoading('', 500);
        } else {
          this.stopLoading('', 500);
        }
      })
      .catch((error) => {
        this.stopLoading('', 500);
        this.showMessage = true;
        this.messageType = "inline";
        this.error = error.message;
      });
  }

  formatNamedCredentials(value) {
    let formattedCredentials = [];
    for (const key in value) {
      let item = value[key];
      let endpoint = item.Endpoint.split(":");
      item.Region = endpoint[2];
      item.AccountNumber = endpoint[3];
      item.attributes = { type: "NamedCredential" };
      formattedCredentials.push(item);
    }
    return formattedCredentials;
  }

  getEventDefinitions() {
    getEventDefinitions()
      .then((data) => {
        if (data) {
          this.eventDefinitions = this.formatEventDefinitions(data);
          this.getPlatformEventChannelMembers();
          this.stopLoading('', 500);
        } else {
          this.stopLoading('', 500);
        }
      })
      .catch((error) => {
        this.stopLoading('', 500);
        this.showMessage = true;
        this.messageType = "inline";
        this.error = error.message;
      });
  }

  formatEventDefinitions(value) {
    let formattedDefinitions = [];
    value = value.sort();
    for (const key in value) {
      let name = value[key];
      let item = {
        label: name,
        value: name
      };
      formattedDefinitions.push(item);
    }
    return formattedDefinitions;
  }

  getPlatformEventChannels() {
    getPlatformEventChannels()
      .then((data) => {
        if (data) {
          this.getEventRelayConfig();
          this.stopLoading('', 500);
        } else {
          this.stopLoading('', 500);
        }
      })
      .catch((error) => {
        this.stopLoading('', 500);
        this.showMessage = true;
        this.messageType = "inline";
        this.error = error.message;
      });
  }

  getPlatformEventChannelMembers() {
    getPlatformEventChannelMembers()
      .then((data) => {
        if (data) {
          this.stopLoading('', 500);
        } else {
          this.stopLoading('', 500);
        }
      })
      .catch((error) => {
        this.stopLoading('', 500);
        this.showMessage = true;
        this.messageType = "inline";
        this.error = error.message;
      });
  }

  updateConfigStatus(state, recordId) {
    this.eventRelayConfigLoading = true;
    const formattedPayload = {
      "State" : state
    }
    updateConfigStatus({
      payload: JSON.stringify(formattedPayload),
      recordId: recordId
    })
      .then(() => {
        this.getEventRelayConfig();
      })
      .catch((error) => {
        this.stopLoading('', 500);
        this.showMessage = true;
        this.messageType = "inline";
        this.error = error.message;
      });
  }


  getEventRelayConfig() {
    getEventRelayConfig()
      .catch((error) => {
        this.stopLoading('EventRelayConfig', 500);
        this.showMessage = true;
        this.messageType = "inline";
        this.error = error.message;
      });
  }

  parseResponse(response) {
    if (response.data.payload) {
      const records = JSON.parse(response.data.payload.Payload__c).records;
      const objectName = records[0].attributes.type;
      switch (objectName) {
        case "PlatformEventChannel":
          this.platformEventChannels = records;
          break;
        case "PlatformEventChannelMember":
          this.platformEventChannelMembers = records;
          this.filterEventDefinitionsByMembers(records);
          //this.enrichChannelMembers(records);
          break;
        case "EventRelayConfig":
          this.eventRelayConfigs = records;
          console.log(JSON.stringify(records));
          this.enrichEventRelayConfigs(records);
          this.stopLoading('EventRelayConfig', 500);
          break;
        default:
          console.log("Type not found");
      }
    }
  }

  filterEventDefinitionsByMembers(value) {
    let filteredList = [];
    for (const key in this.eventDefinitions) {
      if(key){
        const item = this.eventDefinitions[key];
        if (item.label.includes("__e")) {
          filteredList.push(item);
        } else {
          let filteredItems = value.find(
            (member) => member.SelectedEntity === item.label
          );
          if (filteredItems) {
            filteredList.push(item);
          }
        }  
      }
    }
    this.eventDefinitions = filteredList;
  }

  enrichEventRelayConfigs(value) {
    let enrichedConfigs = [];
    if (this.platformEventChannels.length >= 1) {
      for (const key in value) {
        if(key){
          let item = value[key];
          const formattedState = this.formatStateBadge(item);
          item.Style = formattedState.Style;
          item.Status = formattedState.Status;
          const found = this.platformEventChannels.find(
            (channel) => channel.Id === item.EventChannel
          );
          if (found) {
            item.EventChannelName = found.MasterLabel;
          }
          console.log('Enriched: ', enrichedConfigs);
          enrichedConfigs.push(item);  
        }
      }
      this.eventRelayConfigs = enrichedConfigs;
    }
  }

  formatStateBadge(value){
    let formattedState;
    switch (value.State) {
      case "RUN":
        formattedState = {Status: 'Running', Style: 'slds-badge slds-theme_success slds-align-middle slds-m-top_xx-small slds-m-bottom_xx-small'};
        break;
      case "PAUSE":
        formattedState = {Status: 'Paused', Style: 'slds-badge slds-theme_warning slds-align-middle slds-m-top_xx-small slds-m-bottom_xx-small'};
        break;
        case "STOP":
          formattedState = {Status: 'Stopped', Style: 'slds-badge slds-theme_error slds-align-middle slds-m-top_xx-small slds-m-bottom_xx-small'};
          break;  
      default:
        formattedState = {Status: 'None', Style: 'slds-badge slds-align-middle slds-m-top_xx-small slds-m-bottom_xx-small'};
    }
    return formattedState;
  }

  enrichChannelMembers(value) {
    let enrichedConfigs = [];
    if (this.platformEventChannels.length >= 1) {
      for (const key in value) {
        let item = value[key];
        const foundEventDefinition = this.eventDefinitions.find(
          (eventDefinition) => eventDefinition.id === item.SelectedEntity
        );
        if (foundEventDefinition) {
          item.SelectedEntityName = foundEventDefinition.label;
          enrichedConfigs.push(item);
        }
      }
      console.log("enriched configs", enrichedConfigs);
      this.eventRelayConfigs = enrichedConfigs;
    }
  }

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    switch (actionName) {
      case "delete":
        console.log(row);
        break;
      case "show_details":
        this.selectedNamedCredential = row;
        console.log(JSON.stringify(row));
        this.showNamedCredentialModal = true;
        this.modalState = "view";
        break;
        case "RUN":
          this.updateConfigStatus(actionName, row.Id);
          console.log(row.Id);
        break;
        case "PAUSE":
          this.updateConfigStatus(actionName, row.Id);
          console.log(row.Id);
        break;
        case "STOP":
          this.updateConfigStatus(actionName, row.Id);
          console.log(row.Id);
        break;

      default:
    }
  }

  onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.namedCredentials];

    cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
    this.data = cloneData;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;
  }

  sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
          return primer(x[field]);
        }
      : function (x) {
          return x[field];
        };

    return function (a, b) {
      a = key(a);
      b = key(b);
      return reverse * ((a > b) - (b > a));
    };
  }

  get noNamedCredentials() {
    return !this.namedCredentials.length >= 1;
  }

  get noPlatformEventChannels() {
    return !this.platformEventChannels.length >= 1;
  }

  get noEventRelayConfigs() {
    return !this.eventRelayConfigs.length >= 1;
  }

  get noPlatformEventChannelMembers() {
    return !this.platformEventChannelMembers.length >= 1;
  }

  stopLoading(property,timeoutValue) {
    // eslint-disable-next-line
    setTimeout(() => {
      switch(property){
        case "EventRelayConfig":
          this.eventRelayConfigLoading = false;
        break;
        default:
          this.loading = false;
          break;
      }
      this.loading = false;
    }, timeoutValue);
  }

  viewDocs() {
    const url =
      "https://developer.salesforce.com/docs/platform/functions/overview";
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url
      }
    });
  }


  newNamedCredential() {
    this.modalState = "edit";
    this.showNamedCredentialModal = true;
  }

  newPlatformEventChannel() {
    this.modalState = "edit";
    this.showPlatformEventChannelModal = true;
  }

  newPlatformEventChannelMember() {
    this.modalState = "edit";
    this.showPlatformEventChannelMemberModal = true;
  }

  newEventRelayConfig() {
    this.modalState = "edit";
    this.showEventRelayConfigModal = true;
  }

  handleCloseModal() {
    this.showNamedCredentialModal = false;
    this.showPlatformEventChannelModal = false;
    this.showPlatformEventChannelMemberModal = false;
    this.showEventRelayConfigModal = false;
  }

  get showSetup(){
    return this.selectedNavItem === 'setup';
  }

  get showHome(){
    return this.selectedNavItem === 'home';
  }

  get showNamedCredentials(){
    return this.selectedNavItem === 'named-credentials';
  }

  get showEventRelayConfigurations(){
    return this.selectedNavItem === 'event-relay-configurations';
  }

  get showPlatformEventChannels(){
    return this.selectedNavItem === 'event-relay-channels';
  }

  get showPlatformEventChannelMembers(){
    return this.selectedNavItem === 'event-relay-channel-members';
  }

  get step1Completed() {
    return this.setupStep > 1;
  }

  get step2Completed() {
    return this.setupStep > 2;
  }

  get step3Completed() {
    return this.setupStep > 3;
  }

  get step4Completed() {
    return this.setupStep === 4;  
  }


  get step1Classlist() {
    if (this.setupStep === 1) {
      return 'slds-progress__item slds-is-active';
    } else if (this.setupStep > 1) {
      return 'slds-progress__item slds-is-completed';
    }
  }

  get step2Classlist() {
    if (this.setupStep === 2) {
      return 'slds-progress__item slds-is-active';
    } else if (this.setupStep < 2) {
      return 'slds-progress__item';
    } else if (this.setupStep > 2) {
      return 'slds-progress__item slds-is-completed';
    }
  }

  get step3Classlist() {
    if (this.setupStep === 3) {
      return 'slds-progress__item slds-is-active';
    } else if (this.setupStep < 3) {
      return 'slds-progress__item';
    } else if (this.setupStep > 3) {
      return 'slds-progress__item slds-is-completed';
    }
  }

  get step4Classlist() {
    if (this.setupStep === 4) {
      return 'slds-progress__item slds-is-active';
    } else if (this.setupStep < 4) {
      return 'slds-progress__item';
    } else if (this.setupStep > 4) {
      return 'slds-progress__item slds-is-completed';
    }  
}


}
