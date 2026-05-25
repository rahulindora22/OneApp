import { LightningElement,track,api,wire } from 'lwc';
import displayMasterComponent from '@salesforce/apex/SegmentController.displayMasterComponent';
import userId from '@salesforce/user/Id';
export default class OneAppMaster extends LightningElement {
    @track loggedInUserId= userId;
    @track isView = false;
    @track isRWA = false;
    @track isOOH = false;
    @track isDEPO = false;
    @track isCSP = false;
    @track recordTypeRWACheckin;
    @track showMessage = false;
    
    connectedCallback(){
        console.log('--loggedInUserId--'+ this.loggedInUserId);

        displayMasterComponent({ 
            userID:  this.loggedInUserId
            
        })
        
        .then(result => {  
            console.log('USER_ID  = '+this.loggedInUserId);
           console.log('result52'+JSON.stringify(result));
            if(result == 'SUCCESS'){
                console.log('result52'+result);
                this.isView = true;
            }
            else{
                console.log('result52'+result);
                this.showMessage = true;
            }
        })
    }

    handleClickRwa(){
        this.isView = false;
        this.isRWA = true;
        this.isOOH=false;
        this.isDEPO=false;
        this.isCSP=false;
        this.recordTypeRWACheckin ='RWA';
    }

    handleClickOoh(){
        this.isView = false;
            this.isRWA = false;
            this.isOOH=true;
            this.isDEPO=false;
            this.isCSP=false;
            this.recordTypeRWACheckin ='OOH';
        }

    handleClickCsp(){
        this.isView = false;
                this.isRWA = false;
                this.isOOH=false;
                this.isDEPO=false;
                this.isCSP=true;
                this.recordTypeRWACheckin ='CSP';}

    handleClickDepo(){
        this.isView = false;
                    this.isRWA = false;
                    this.isOOH=false;
                    this.isDEPO=true;
                    this.isCSP=false;
                    this.recordTypeRWACheckin ='DEPO';}

    handleRWABack(){
        this.isRWA = false;
        this.isView = true;
                    }

     handleOOHBack(){
        this.isOOH = false;
        this.isView = true;
                     }

     handleCSPBack(){
      this.isCSP = false;
      this.isView = true;
                      }

     handleDEPOBack(){
     this.isDEPO = false;
     this.isView = true;
                       }
  

}