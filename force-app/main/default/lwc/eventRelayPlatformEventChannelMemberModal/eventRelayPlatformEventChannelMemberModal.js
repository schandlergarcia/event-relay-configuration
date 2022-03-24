import { LightningElement, track, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import createObject from "@salesforce/apex/EventRelayController.createObject";
import getCurrentDateTime from "@salesforce/apex/EventRelayController.getCurrentDateTime";
import checkJobStatus from "@salesforce/apex/EventRelayController.checkJobStatus";

export default class EventRelayPlatformEventChannelMemberModal extends LightningElement {
  @api modalState;
  @track _selectedChannelMember = { label: "", name: "" };
  @api
  get selectedChannelMember() {
    return this._selectedChannelMember;
  }
  set selectedChannelMember(value) {
    this._selectedChannelMember = this.setChannelFromParent(value);
  }

  _platformEventChannels;
  @api
  get platformEventChannels() {
    return this._platformEventChannels;
  }
  set platformEventChannels(value) {
    this._platformEventChannels = this.formatPlatformEventChannels(value);
  }

  @api eventDefinitions;
  loading = false;
  dateTimeSubmitted;

  //Error Handling
  error;
  messageType;
  showMessage = false;

  setChannelFromParent(value) {
    let channel = { label: "", name: "" };
    console.log(value);
    if (value !== undefined) {
      channel.label = value.FullName;
      channel.name = value.Label;
      channel.Id = value.Id;
    }
    return channel;
  }

  formatPlatformEventChannels(value) {
    let channels = [];
    if (value !== undefined) {
      for (const key in value) {
        let record = value[key];
        let item = {
          label: record.MasterLabel,
          value: record.DeveloperName
        };
        channels.push(item);
      }
    }
    console.log(channels);
    return channels;
  }

  getDateTime() {
    getCurrentDateTime({})
      .then((data) => {
        this.dateTimeSubmitted = data;
      })
      .catch((error) => {
        console.log("Unable to get Date/time");
      });
  }

  handleInputChange(event) {
    let fieldName = event.target.name;
    let value = event.detail.value;
    if (value !== undefined) {
      this._selectedChannelMember[fieldName] = value.trim();
    }
  }

  nextStage() {
    switch (this.modalState) {
      case "edit":
        this.create();
        break;
      case "view":
        this.navigateToNamedCredential();
        break;
      default:
        console.log("Incorrect Stage");
    }
  }

  navigateToNamedCredential() {
    window.open(
      `/lightning/setup/NamedCredential/page?address=%2F${this._selectedCredential.Id}`
    );
  }

  formatChannelPayload() {
    let payload = {
      FullName: `${
        this._selectedChannelMember.eventChannel
      }_chn_${this._selectedChannelMember.selectedEntity.slice(0, -3)}_e`,
      Metadata: {
        eventChannel: `${this._selectedChannelMember.eventChannel}__chn`,
        selectedEntity: this._selectedChannelMember.selectedEntity
      }
    };
    console.log(JSON.stringify(payload));
    return payload;
  }

  create() {
    this.loading = true;
    this.getDateTime();
    console.log(JSON.stringify(this._selectedChannelMember));
    let formattedPayload = this.formatChannelPayload();
    createObject({
      payload: JSON.stringify(formattedPayload),
      objectName: "PlatformEventChannelMember"
    })
      .then((data) => {
        this.checkStatus();
      })
      .catch((error) => {
        this.stopLoading(100);
        this.showUIMessage(
          "Error",
          error.message,
          "error",
          "utility:error",
          "inverse"
        );
      });
  }

  checkStatus() {
    checkJobStatus({
      submittedDatetime: this.dateTimeSubmitted,
      methodName: "createObject"
    })
      .then((data) => {
        if (data) {
          let status = data.Status;
          console.log("Status: " + status);
          if (
            status === "Aborted" ||
            status === "Completed" ||
            status === "Failed"
          ) {
            if (status === "Completed") {
              this.stopLoading(100);
              this.showUIToast(
                "Success",
                "The Platform Event Channel has been Created",
                "success"
              );
              this.hideUIMessage();
              this.closeModal();
            } else {
              this.stopLoading(100);
              this.showUIMessage(
                data.Status,
                data.ExtendedStatus,
                "error",
                "utility:error",
                "inverse"
              );
            }
          } else {
            setTimeout(() => {
              this.checkStatus();
            }, 300);
          }
        } else {
          setTimeout(() => {
            this.checkStatus();
          }, 100);
        }
      })
      .catch((error) => {
        this.showUIMessage(
          "Error",
          error.message,
          "error",
          "utility:error",
          "inverse"
        );
        this.stopLoading(100);
      });
  }

  stopLoading(timeoutValue) {
    setTimeout(() => {
      this.loading = false;
    }, timeoutValue);
  }

  showUIMessage(title, message, variant, icon, iconVariant) {
    this.messageTitle = title;
    this.messageBody = message;
    this.messageVariant = variant;
    this.messageIcon = icon;
    this.messageIconVariant = iconVariant;
    this.showMessage = true;
  }

  hideUIMessage() {
    this.messageTitle;
    this.messageBody;
    this.messageVariant;
    this.messageIcon;
    this.messageIconVariant;
    this.showMessage = false;
  }

  showUIToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }

  get nextButtonLabel() {
    return this.modalState === "edit" ? "Save" : "Edit";
  }

  closeModal() {
    this.dispatchEvent(new CustomEvent("closemodal"));
  }

  get editState() {
    return this.modalState === "edit";
  }

  get viewState() {
    return this.modalState === "view";
  }
}
