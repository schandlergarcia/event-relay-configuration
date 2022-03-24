import { LightningElement, track, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import createObject from "@salesforce/apex/EventRelayController.createObject";
import getCurrentDateTime from "@salesforce/apex/EventRelayController.getCurrentDateTime";
import checkJobStatus from "@salesforce/apex/EventRelayController.checkJobStatus";

export default class EventRelayPlatformEventChannelModal extends LightningElement {
  @api modalState;
  @track _selectedChannel = { label: "", name: "" };
  @api
  get selectedChannel() {
    return this._selectedChannel;
  }
  set selectedChannel(value) {
    this._selectedChannel = this.setChannelFromParent(value);
  }
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
      this._selectedChannel[fieldName] = value.trim();
    }
    if (this.fieldName == "label") {
      this.setNameValue();
    }
    console.log(JSON.stringify(this._selectedChannel));
  }

  setNameValue() {
    this._selectedChannel.name = this._selectedChannel.label.replace(/ /g, "_");
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
      FullName: `${this._selectedChannel.name}__chn`,
      Metadata: {
        channelType: "event",
        label: this._selectedChannel.label
      }
    };
    console.log(JSON.stringify(payload));
    return payload;
  }

  create() {
    this.loading = true;
    this.getDateTime();
    console.log(JSON.stringify(this._selectedChannel));
    let formattedPayload = this.formatChannelPayload();
    createObject({
      payload: JSON.stringify(formattedPayload),
      objectName: "PlatformEventChannel"
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
