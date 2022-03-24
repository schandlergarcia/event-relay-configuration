import { LightningElement, track, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import createObject from "@salesforce/apex/EventRelayController.createObject";
import getCurrentDateTime from "@salesforce/apex/EventRelayController.getCurrentDateTime";
import checkJobStatus from "@salesforce/apex/EventRelayController.checkJobStatus";

export default class EventRelayNamedCredentialModal extends LightningElement {
  @api modalState;
  @track _selectedCredential = {
    label: "",
    name: "",
    accountNumber: "",
    region: ""
  };
  @api
  get selectedCredential() {
    return this._selectedCredential;
  }
  set selectedCredential(value) {
    this._selectedCredential = this.setCredentialFromParent(value);
  }
  loading = false;
  dateTimeSubmitted;

  //Error Handling
  error;
  messageType;
  showMessage = false;

  setCredentialFromParent(value) {
    let credential = { label: "", name: "", accountNumber: "", region: "" };
    console.log(value);
    if (value !== undefined) {
      credential.label = value.MasterLabel;
      credential.name = value.DeveloperName;
      credential.accountNumber = value.AccountNumber;
      credential.region = value.Region;
      credential.Id = value.Id;
    }
    return credential;
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
      this._selectedCredential[fieldName] = value.trim();
    }
    if (this.fieldName == "label") {
      this.setNameValue();
    }
    console.log(JSON.stringify(this._selectedCredential));
  }

  setNameValue() {
    this._selectedCredential.name = this._selectedCredential.label.replace(
      / /g,
      "_"
    );
    console.log(this._selectedCredential.label.replace(/ /g, "_"));
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

  formatCredentialsPayload() {
    let payload = {
      FullName: this._selectedCredential.name,
      Metadata: {
        endpoint: `arn:aws:${this._selectedCredential.region}:${this._selectedCredential.accountNumber}`,
        generateAuthorizationHeader: true,
        label: this._selectedCredential.label,
        principalType: "NamedUser",
        protocol: "NoAuthentication"
      }
    };
    return payload;
  }

  create() {
    this.loading = true;
    this.getDateTime();
    let formattedPayload = this.formatCredentialsPayload();
    createObject({
      payload: JSON.stringify(formattedPayload),
      objectName: "NamedCredential"
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
                "The Named Credential has been Created",
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
