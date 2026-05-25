import { LightningElement,track,api,wire } from 'lwc';
import displaySegmentsCSP from '@salesforce/apex/SegmentController.displaySegmentsCSP';

import getTransDetails from '@salesforce/apex/SegmentController.getTransDetails';
import displaySegmentContactVendor from '@salesforce/apex/SegmentController.getSegmentContactVendor';
import { NavigationMixin } from 'lightning/navigation';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import checkOutFromOneApp from '@salesforce/apex/GeolocationController.checkOutFromOneApp'; 
import validateDepoCheckInStatus from '@salesforce/apex/GeolocationController.validateCheckInToday';
import checkInFromOneApp from '@salesforce/apex/GeolocationController.checkInFromOneApp';
import recordTypeCSP from '@salesforce/apex/SegmentController.recordTypeCSP';
import { RefreshEvent } from 'lightning/refresh';
import recordTypeSegmentContact from '@salesforce/apex/SegmentController.recordTypeSegmentContact';
import recordTypeSegmentContactVendor from '@salesforce/apex/SegmentController.recordTypeSegmentContactVendor';
import getSegmentContacts from '@salesforce/apex/SegmentController.getSegmentContacts';
import checkInSecondTime from '@salesforce/apex/GeolocationController.checkInSecondTime';
import insertTransactionDetails from '@salesforce/apex/GeolocationController.insertTransactionDetails';
import { updateRecord } from 'lightning/uiRecordApi';
import viewTransactionDetails from '@salesforce/apex/SegmentControllerCSP.viewTransactionDetails';
import viewTransactionDetailsSecondTime from '@salesforce/apex/SegmentControllerCSP.viewTransactionDetailsSecondTime';
import NAME_FIELD from '@salesforce/schema/Segment_Contact__c.Name';
import EMAIL_FIELD from '@salesforce/schema/Segment_Contact__c.Email__c';
import PHONE_FIELD from '@salesforce/schema/Segment_Contact__c.Phone__c';
import DESIGNATION_FIELD from '@salesforce/schema/Segment_Contact__c.Designation__c';
import SEGMENT_FIELD from '@salesforce/schema/Segment_Contact__c.Segment__c';
import saveSegmentContacts from '@salesforce/apex/SegmentController.saveSegmentContacts';
import TSNAME_FIELD from '@salesforce/schema/Transactional_Details__c.Name';
import getTDetails from '@salesforce/apex/SegmentController.getTDetails';
import COMPANY_FIELD from '@salesforce/schema/Transactional_Details__c.Choose_Company__c';
import NEWSPAPER_FIELD from '@salesforce/schema/Transactional_Details__c.Choose_Newspaper__c';
import TSFTD_FIELD from '@salesforce/schema/Transactional_Details__c.FTD_Count__c';
import getNeswpaperPicklist from '@salesforce/apex/SegmentController.getNeswpaperPicklist';
import TSSEGMENT_FIELD from '@salesforce/schema/Transactional_Details__c.Segment__c';
import saveTransDetail from '@salesforce/apex/SegmentController.saveTransDetail';
import getTypes from '@salesforce/apex/SegmentController.getTypes';
import getTDPicklistValues from '@salesforce/apex/SegmentController.getTDPicklistValues';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import Segment_Object from '@salesforce/schema/Segment_Contact__c';
import INDUSTRY_FIELD from '@salesforce/schema/Segment_Contact__c.Designation__c';
import txnVisitSave from '@salesforce/apex/GeolocationController.txnVisitSave';





const columns = [ { label: 'Segment Contact Name', fieldName: 'Name'},
                  { label: 'Email', fieldName: 'Email__c'},
                  { label: 'Phone', fieldName: 'Phone__c', type: 'phone'},
                  
                  { label: 'Designation', fieldName: 'Designation__c'},
                ];


const actions = [
    { label: 'Edit', name: 'edit', iconName: 'utility:edit' },
];
const columnsTSN =[
    { label: 'Name Of Newspaper', fieldName: 'Name', sortable: "true", type: 'text' },
    {  label: 'FTD Count', fieldName: 'FTD_Count__c', sortable: "true",editable: true },
];

export default class OneAppLwc extends NavigationMixin(LightningElement) {


    @wire(getObjectInfo, { objectApiName: Segment_Object })
    accountMetadata;
    // 0129D000001B93EQAS
    @wire(getPicklistValues,

       {
           
           recordTypeId: '0125D0000016jIsQAI', 

           fieldApiName: INDUSTRY_FIELD

       }

   )

   pickval;



   connectedCallback(){
       console.log('pickval-'+JSON.stringify(this.pickval));
       console.log('accountMetadata-'+JSON.stringify(this.accountMetadata.data));
      
      }


    @track l_All_Types;
    @track TypeOptions;
    @track TDtoggle;
    @api objectApiName;
    @api recordId;
    @api recordIdSegC
    @track viewOneApp = true;
    @track isCheckInOutShow=false;
    @track isCheckInShow=true;
    @track recordTypeId;
    @track isRWAComp=true;
    @track isRWA=true;
    @track isOOH=true;
    @track isDEPO=true;
    @track isCSP=true;
    @track newRecord=false;
    @track selectedValue;
    @track segmentRecord;
    @track depoSegmentRecord;
    @track segmentId;
    @track transId;
    @track viewSegmentRecord = false;
    @track isOOHComp = false;
    @track viewSegmentRecordOOH = false;
    @track newOOHRecord = false;
    @track showAfterSave = false;
    @track isCSPComp = false;
    @track viewSegmentRecordCSP = false;
    @track newCSPRecord = false;
    @track newRecordView = false;
    @track newOOHRecordView = false;
    @track newCSPRecordView = false;
    @track viewSegmentRecordDEPO = false;
    @track viewDEPO = false;
    @track createSegConContact=false;
    @track createSegConVendor = false;
    @track createTransactionDetails = false;
    @track recordType;
    @track recordTypeSegC;
    @track recordTypeSegV;
    @track viewSegmentContact = false;
    @track viewSegmentVendor = false;
    @track SegrecordView = false;
    @track SegrecordVendView = false;
    @track newTransactionDetails = false;
    @track transactionData;
    @track transactionData1;
    @track columnsTSN = columnsTSN;
    @track viewTransactionData;
    @track ViewSegmentContactAfterCreate =false;
    @track pickValues;
    @track PaperValues;
    @track Picklist_Value;
    @track SCList1 = [];
    @track SCList = [];
    @track SVList = [];
    @track SVList1 = [];
    @track index = 1;
    @track index1 = 1;
    @api recordIdSC;
    @track name = NAME_FIELD;
    @track email = EMAIL_FIELD;
    @track phone = PHONE_FIELD;
    @track designation = DESIGNATION_FIELD;
    @track recordtypeForSC ;
    @track segmentIdforSC = SEGMENT_FIELD;
    @track recordIdNewSeg = SEGMENT_FIELD;
    @track ShowRowSC=false;
    @track ShowRowSV=false;
    @track tdNewsp;
    @track TDPList = [];
    @track TSList = [];
    @track TSname = TSNAME_FIELD;
    @track TScomp = COMPANY_FIELD;
    @track TSnewsp = NEWSPAPER_FIELD;
    @track ftdcount;
    @track ftd = TSFTD_FIELD;
    @track TSSegement = TSSEGMENT_FIELD;
    @track CreateTSrecord = false;
    @track CreateTSrecordNew = false;
    @track lastDate;
    @track tdRec;
    @track chooseNewspaper = true;
    @track closeExitCSP=true;
    @track isCSPUpdate=false;
    @track showTable = true;
    @track conName;
    @track conEmail;
    @track conPhone;
    @track conDesignation;
    @track accountEditId;
    @track showAccEditPop1;
    @track contactEditId;
    @track showConEditPop1;
    @track vendorCodeId;

    @track showTableRWAFirst=false;
    @track showTableRWASecond=false;
    @track showTableForRWACovidCheck = false;
    @track showTableForRWABothCheck = false;
    @track newNewsPaperInsert = [];
    @track CompValues = [];
    @track pickValues=[];
    @track PaperValues;
    



    
    searchValueRWA = '';
    searchValueOOH = '';
    searchValueCSP = '';
    locationButtonDisabled = false;
    sortedColumn;
    sortedDirection = 'asc';
    isAsc = false;
    isDsc = true;
    //flag restricts accessing geolocation api multiple times
    isRendered = false;
    recordTypeRWACheckin;
    recordTypeDepoCheckin;
    draftValues = [];
    draftValuesTsn = [];
    @track CompValues = [];


    options1 = {
        label : getTDPicklistValues()
        .then(result => {
            console.log('company picklist = '+result);
             this.CompValues = result;
            
        })
        .catch(error => {
              
        }),
        value : getTDPicklistValues()
        .then(result => {
            console.log('company picklist = '+result);
             this.CompValues = result;
            
        })
        .catch(error => {
              
        }),
       }


    // DYNAMIC ROW ADD AND REMOVE CODE STARTS PART1
    @api record ={
        firstName : '',
        lastName : '',
        Email : '',
        Phone : '',
        designation : '',
        segmentIdforSC : '',
        recordIdNewSeg:'',
        Title : ''
    }
   

    tcc = {
        Name : this.TSname,
        Choose_Company__c : this.TScomp,
        Choose_Newspaper__c : this.TSnewsp,
        FTD_Count__c : this.ftd,
        Segment__c : this.TSSegement,
        key :''
    }

  
    scc ={
        Name : this.name,
        Email__c : this.email?this.email : "",
        Phone__c : this.phone,
        Designation__c : this.designation?this.designation : "",
        RecordTypeId : this.recordtype,
        Segment__c : this.segmentIdforSC,
        key :''
    }
    svv1 ={
        Name : this.name,
        Email__c : this.email?this.email : "",
        Phone__c : this.phone,
        Designation__c : this.designation?this.designation : "",
        RecordTypeId : this.recordtype,
        Segment__c : this.segmentIdforSC,
        key :''
    }

    svv ={
        Name : this.name,
        Email__c : this.email?this.email : "",
        Phone__c : this.phone,
        Designation__c : this.designation?this.designation : "",
        RecordTypeId : this.recordtype,
        Segment__c : this.segmentIdforSC,
        key :''
    }

    scc1 ={
        Name : this.name,
        Email__c : this.email?this.email : "",
        Phone__c : this.phone,
        Designation__c : this.designation?this.designation : "",
        RecordTypeId : this.recordtype,
        Segment__c : this.segmentIdforSC,
        key :'',
        
    }

   

    @track ShowRowSV1=false;
    addRowNewSV(){

        this.index++;
        var i = this.index;
        this.svv1.key = i;
        this.SVList1.push(JSON.parse(JSON.stringify(this.svv1)));
        this.ShowRowSV1 = true;
        
    }


@track ShowRowSC1=false;
    addRowNewSC(){

        this.index++;
        var i = this.index;
        this.scc1.key = i;
        this.SCList1.push(JSON.parse(JSON.stringify(this.scc1)));
        this.ShowRowSC1 = true;
        
        
    }



    addRow(){

        this.index++;
        var i = this.index;
        this.scc.key = i;
        this.SCList.push(JSON.parse(JSON.stringify(this.scc)));
        this.ShowRowSC = true;
        this.topFunction();
        
    }

    addRow1(){

        this.index1++;
        var i = this.index1;
        this.ShowRowSV = true;
        this.topFunction();
        this.svv.key = i;
        this.SVList.push(JSON.parse(JSON.stringify(this.svv)));

       
    }

    closeModalPop(){
        this.ShowRowSC = false;
        this.ShowRowSV = false;
        this.CreateTSrecord = false;
        this.showConEditPop1 = false;
        this.CreateTSrecord = false;
        this.showAccEditPop1 = false;  

    }



    

   
    handleChange(event){
        this.tdRec = event.target.value;
        console.log('tdRec = '+this.tdRec);
        if(this.tdRec == 'OTHERS') {
            this.chooseNewspaper = false;
    }
    else{
        this.chooseNewspaper = true;
        for(var i=0; i<this.PaperValues.length; i++){
            if(this.PaperValues[i].key==this.tdRec){

                this.pickValues = this.PaperValues[i].pickValue;

            }

        }
       

    }
    console.log('chooseNewspaper T/F = '+this.chooseNewspaper);
    
    }

    handleChangeoption(event){
        this.tdNewsp = event.target.value;

    }



    saveTDNP() {
        this.index1++;
        var i = this.index1;
        this.tcc1.key = i;
        this.TDPList.push(JSON.parse(JSON.stringify(this.tcc1)));
        console.log('tssList'+JSON.stringify(this.TDPList));
        saveTransDetail({tssList : this.TDPList})
            .then(result => {
                this.message = result;
                this.error = undefined;
                if(this.message !== undefined) {
                    this.tcc1.Name = '';
                    this.tcc1.FTD_Count__c = '';
                    this.tcc1.Second_Last_Visit__c = '';
                    this.tcc1.Last_Visit__c = '';
                    this.tcc1.Segment__c = '';
                    this.tcc1.Choose_Newspaper__c = '';
                    this.tcc1.Choose_Company__c = '';
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Record created successfully',
                            variant: 'success',
                        }),
                    );
                }
                
                console.log(JSON.stringify(result));
                console.log("result", this.message);
                
            })
            .catch(error => {
                this.message = undefined;
                this.error = error;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
                console.log("error", JSON.stringify(this.error));
            });
            
      
    }
    topFunction(){
        const scrollOptions = {
            left: 0,
            top: 0,
            behavior: 'smooth'
        }
        window.scrollTo(scrollOptions);
    }
    
    editContactCSP(event){
        
            var cv = event.currentTarget;
            console.log('Edit Contact  2 = ', cv);
            let itemIndex = event.target.getAttribute("data-id");  
            console.log('--itemIndex--',itemIndex);
            this.contactEditId = itemIndex;
            console.log('contactEditId = ', this.contactEditId);
            this.showConEditPop1 = true;
            console.log('showConEditPop1 = ', this.showConEditPop1);
            
        this.topFunction();
    }

    editAccount(event){
        var cv = event.currentTarget;
        console.log('Edit account  2 = ', cv);
        let itemIndex = event.target.getAttribute("data-id");  
        console.log('--itemIndex--',itemIndex);
        this.accountEditId = itemIndex;
        console.log('accountEditId = ', this.accountEditId);
        this.showAccEditPop1 = true;
        console.log('showAccEditPop1 = ', this.showAccEditPop1);
        
    this.topFunction();
     
        
    }

   

    handleSuccessCont(event){
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'success',
                message: 'Contact Record has been updated',
                variant: 'success'
            })
        );
        
        this.contList = '';
        this.showConEditPop1 = false;
        this.showTable = false;

        
        getSegmentContacts({ segmentIdforSegContacts : this.segmentIdforSC}) 
        .then(results => { 
         console.log('Ashish true record Id = '+results); 
         this.showTable = true;
                this.contList = results;  

                })
                .catch(error => {
                 console.log('Ashish error record Id = '+error); 

                this.error = error;

                }

             
        );
            }


    
    handleSuccessVendor(event){
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'success',
                message: 'Account Record has been updated',
                variant: 'success'
            })
        );
        
        this.vendList = '';
        this.showAccEditPop1 = false;
        this.createSegConContact = false;


        displaySegmentContactVendor({segmentIdforSegCntcts : this.segContId})
        .then(results => { 
         console.log('Ashish true record Id 11 = '+results); 
         this.createSegConContact = true;
                this.vendList = results;  

                })
                .catch(error => {
                 console.log('Ashish error record Id 11= '+error); 

                this.error = error;

                }

             
        );
        
        
    }

   
   addRow2(){
    this.TDtoggle = false;
    getTDPicklistValues()
        .then(result => {
            console.log('company picklist 1 = '+JSON.stringify(result));
             this.CompValues = result;
            
        })
        .catch(error => {
              
        });

        getNeswpaperPicklist()
        .then(result => {
            console.log('newspaper picklist 1 = '+JSON.stringify(result));
            this.PaperValues = result;
            
        })
        .catch(error => {
              
        });
        

        this.index1++;
        var i = this.index1;
       // this.ShowRowSV = true;
        this.CreateTSrecord = true;
        this.topFunction();
       // this.CreateTSrecordNew = true;
        this.tcc.key = i;
        this.tcc.Choose_Company__c = this.CompValues;
        this.tcc.Choose_Company__c = this.pickValues;
        this.TSList.push(JSON.parse(JSON.stringify(this.tcc)));
console.log('TS LIST FOR ADD NEW = '+JSON.stringify(this.TSList));
       
    }


    removeRow(event){
        this.isLoaded = true;
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        if(this.SCList.length>1){
            this.SCList.splice(key, 1);
            this.index--;
            this.isLoaded = false;
           // this.ShowRowSC = false;
        }else if(this.SCList.length == 1){
            this.SCList = [];
            this.index = 0;
            this.isLoaded = false;
            this.ShowRowSC = false;
        }

        if(this.SCList1.length>1){
            this.SCList1.splice(key, 1);
            this.index--;
            this.isLoaded = false;
           // this.ShowRowSC = false;
        }else if(this.SCList1.length == 1){
            this.SCList1 = [];
            this.index = 0;
            this.isLoaded = false;
            this.ShowRowSC1 = false;
        }

       

        //this.dispatchEvent(new CustomEvent('deleterow', {detail: this.index}));
        //console.log(' After adding Record List ', this.dispatchEvent);
    } 

    removeRowSV(event){
        this.isLoaded = true;
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        if(this.SVList.length>1){
            this.SVList.splice(key, 1);
            this.index--;
            this.isLoaded = false;
        }else if(this.SVList.length == 1){
            this.SVList = [];
            this.index = 0;
            this.isLoaded = false;
            this.ShowRowSV = false;
        }
        
        if(this.SVList1.length>1){
            this.SVList1.splice(key, 1);
            this.index--;
            this.isLoaded = false;
        }else if(this.SVList1.length == 1){
            this.SVList1 = [];
            this.index = 0;
            this.isLoaded = false;
            this.ShowRowSV1 = false;
        }


    }


    removeRowTS(event){
        this.isLoaded = true;
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        if(this.TSList.length>1){
            this.TSList.splice(key, 1);
            this.index--;
            this.isLoaded = false;
        }else if(this.TSList.length == 1){
            this.TSList = [];
            this.index = 0;
            this.isLoaded = false;
        }

        //this.dispatchEvent(new CustomEvent('deleterow', {detail: this.index}));
        //console.log(' After adding Record List ', this.dispatchEvent);
    } 
    // DYNAMIC ROW ADD AND REMOVE CODE ENDS PART1

//searchKeywordRWA in RWA 
    searchKeywordRWA(event) {
        this.searchValueRWA = event.target.value;
       
        if (this.searchValueRWA !== '') {
            displaySegmentsCSP({
                    searchkey: this.searchValueRWA
                })
                .then(result => {
                    // set @track contacts variable with return contact list from server  
                   console.log('result52'+JSON.stringify(result));
                   console.log('result.length'+result.length);
               
                    this.segmentRecord = result;  
                    console.log('final segment record = '+JSON.stringify(this.segmentRecord));  
                })
                .catch(error => {
                   
                    const event = new ShowToastEvent({
                        title: 'Error',
                        variant: 'error',
                        message: error.body.message,
                    });
                    this.dispatchEvent(event);
                    // reset contacts var with null   
                    this.segmentRecord = null;
                });
        } else {
            // fire toast event if input field is blank
            const event = new ShowToastEvent({
                variant: 'error',
                message: 'Search text missing..',
            });
            this.dispatchEvent(event);
        }
    }

    sortRecs(event) {

        let colName = event.target.name;
        console.log( 'Column Name is ' + colName );
        if ( this.sortedColumn === colName ) {
            this.sortedDirection = ( this.sortedDirection === 'asc' ? 'desc' : 'asc' );
        }
        else {
            this.sortedDirection = 'asc';
        }
        // check arrow direction
        if (this.sortedDirection === 'asc') {
            this.isAsc = true;
            this.isDsc = false;
        } 
        else {
            this.isAsc = false;
            this.isDsc = true;
        }

        let isReverse = this.sortedDirection === 'asc' ? 1 : -1;

        this.sortedColumn = colName;

        // sort the data
        this.segmentRecord = JSON.parse( JSON.stringify(this.segmentRecord)).sort( ( a, b ) => {
            a = a[ colName ] ? a[ colName ].toLowerCase() : ''; // Handle null values

            b = b[ colName ] ? b[ colName ].toLowerCase() : '';
            return a > b ? 1 * isReverse : -1 * isReverse;
        });;

    }
//handleClickRwa in RWA
    handleClickRwa(){
        this.isRWAComp = true;
        this.isOOH=false;
        this.isDEPO=false;
        this.isCSP=false;
        this.recordTypeRWACheckin ='CSP';

    }

    onBackClickRWA(){
        this.isRWAComp = false;
        this.isOOH=true;
        this.isDEPO=true;
        this.isCSP=true;
        this.segmentRecord = null;
        this.searchValueRWA = '';
        this.viewSegmentRecordOOH = false;
        this.dispatchEvent(new CustomEvent('cspback'));

    }
    handleSubmit1(event){

    }
    updateCSP(){
        this.closeExitCSP = false;
        this.isCSPUpdate = true;
      }

    navigateToNew() {
        this.newRecord=true;
        this.isRWAComp=false;
        recordTypeCSP()
        .then(result => {
            this.recordType = result;
        })
        .catch(error => {
              
        });
        
        recordTypeSegmentContact()
        .then(result => {
            this.recordTypeSegC = result;
            
        })
        .catch(error => {
              
        });
        console.log('289');
        console.log('RCFORSC'+JSON.stringify(this.recordTypeSegC));

        recordTypeSegmentContactVendor()
        .then(result => {
            this.recordTypeSegV = result;
        })
        .catch(error => {
              
        });
    }

    onBackCreateNew(){
        this.isRWAComp = true;
        this.newRecord=false;
       this.newRecordView=false;
       this.newRecord = false;
    }

    refreshComponent(){
        this.searchValueRWA = '';
        this.searchValueCSP = '';
        this.searchValueOOH = '';
        this.segmentRecord = '';
    }
    handleSubmitCont(event){
        const fields = event.detail.fields;
        console.log('fields 11111= '+fields.Phone__c);
        var validMob = fields.Phone__c;
        console.log('validMob = '+validMob.length);
        if(validMob.length < 10 || validMob.length > 10){
            console.log('--validMob--IN--@@@@'+validMob);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please Enter Valid Mobile Number.',
                    variant: 'error',
                }),
                
            );
            event.preventDefault(); 
           
    }
}

    handleSubmit(event){

        //event.preventDefault();       
        const fields = event.detail.fields;
        console.log('fields = '+fields);
        console.log('fields 11111= '+fields.Business_Partner__c);
         var vendorId = fields.Business_Partner__c;
        console.log('vendorId = '+vendorId);
      // var updateFlds1 =  event.detail.id;
     //  console.log('updateFlds = '+updateFlds1);
     //  var updateFlds =  event.detail.value;
     
       if(this.vendList.length > 0){
        for(var j=0; j< this.vendList.length; j++){
            console.log('-- this.vendList--'+ JSON.stringify(this.vendList[j].Business_Partner__c));
              if(this.vendList[j].Business_Partner__c == vendorId ){
                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'This Business Partner already added on this segment.',
                        variant: 'error',
                    }),
                    
                );
                event.preventDefault(); 
               break;
                
              }
              else{
                  
              }
              
        }
    }
    else{

    }
   
       
    }
     
      handleSuccess(event){
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'success',
                  message: 'Record has been updated',
                  variant: 'success'
              })
          );
  
          this.isCSPUpdate = false;
          this.closeExitCSP = true;
      }
   
  
    handleSubmitRWA(event){
        this.recordId = event.detail.id;
        this.segmentIdforSC = this.recordId;
       
        this.recordIdNewSeg = this.recordId.slice(0, -3);

        console.log('recordId 509 = '+this.recordIdNewSeg);
        console.log('recordId148 '+this.recordId);
         
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'New Record Has Been Created',
                    variant: 'success'
                })
            );
            
           //this.newRecordView = true;
           
           //this.isRWAComp = true;
           this.viewSegmentContact = true;
           this.viewSegmentVendor = true;
           this.showTable = true;
          


         //this.viewSegmentRecord = true;
        
        // this.viewSegConContact = true;
        // this.viewSegConVendor = true;
         this.newRecord=false;   
                
        }
        else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: 'Complete The Details',
                    variant: 'error'
                })
            ); 
            
        }
        insertTransactionDetails({
            recordId : this.recordId 
           

        })
        .then(result => {
            console.log('recordId check 752= '+this.recordId);
            this.transactionData1 = result;
            console.log('recordId detail check 755= '+JSON.stringify(this.transactionData1));

            //this.newTransactionDetails = true;
            this.viewSegmentRecord = true;
            console.log('recordId check Rahul--');
            this.segmentId = this.recordId;
            this.viewTsnDetailrecords();
            this.viewOneApp = true;
            this.isRWA = true;

           // this.showTableRWAFirst = true;
            console.log('recordId check Rahul Out--');
        })
        .catch(error => {
            this.error = error;
            this.newTransactionDetails = false;
        });
       
    }


    handleSubmitSCRWA(event){
        this.recordIdSegC = event.detail.id;
        console.log('recordId148 '+this.recordId);
         
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'New Record Has Been Created',
                    variant: 'success'
                })
            );
            this.SegrecordView = true;
            this.ViewSegmentContactAfterCreate = true;
            this.viewSegmentContact = false;
            this.newRecord=false;       
        }
        else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: 'Complete The Details',
                    variant: 'error'
                })
            ); 
            
        }
    }

  

    onBackCreateView(){
        this.newRecordView = false;
        this.viewSegmentContact = false;
        this.viewSegmentVendor = false;
        this.SegrecordVendView =false;
        this.newRecord = true;
      //  this.newRecord = false;
        this.newTransactionDetails = false;
        this.SegrecordView = false;
    }


     @track columnsTSN1 =[
        { 
        label: 'Name Of Newspaper', 
        fieldName: 'Name', 
        type: 'text'
     },

        {  
         label: 'FTD Count',
         fieldName: 'FTD_Count__c', 
         type: 'Number',
         editable: true 
          },
    ];

     @track columns = [
        {
            label: 'Edit',
            type: 'button-icon',
            initialWidth: 50,
            typeAttributes: {
                iconName: 'action:preview',
                title: 'Preview',
                variant: 'border-filled',
                alternativeText: 'View'},
        }, 
        {
        label: 'Name',
        fieldName: 'Name',
        type: 'Name',
    },
    {
        label: 'Phone',
        fieldName: 'Phone__c',
        type: 'Phone',
        
        
    },
    
    {
        label: 'Email',
        fieldName: 'Email__c',
        type: 'Email',
        
        
    },
    
    {
        label: 'Designation',
        fieldName: 'Designation__c',
        type: 'String',
        
        
    },
   
];

@track columnsSCD = [
    {
        label: 'Edit',
        type: 'button-icon',
        initialWidth: 50,
        typeAttributes: {
            iconName: 'action:preview',
            title: 'Preview',
            variant: 'border-filled',
            alternativeText: 'View'},
    },
    {
    label: 'Name',
    fieldName: 'Name',
    type: 'Name',
    sortable: true
},
{
    label: 'Phone',
    fieldName: 'Phone__c',
    type: 'Phone',
    sortable: true
},
{
    label: 'Email',
    fieldName: 'Email__c',
    type: 'Email',
    sortable: true
},
{
    label: 'Designation',
    fieldName: 'Designation__c',
    type: 'Text',
    sortable: true
  /*  label: 'BP Code',
   fieldName: 'Segment__c',
    type: 'String',
    sortable: true*/
},
];

// DataTable For Transaction Details

@track columnsTD = [
    
   {
   label: 'Name of Newspapers',
    fieldName: 'Name',
    type: 'Text',
    sortable: true
},
{
    label: 'Last Visit Date',
    fieldName: 'Last_Visit__c',
    type: 'Number',
    sortable: true
},
{
    label: 'Second Last Visit Date',
    fieldName: 'Second_Last_Visit__c',
    type: 'Number',
    sortable: true
},
{
    label: 'FTD Count',
    fieldName: 'FTD_Count__c',
    type: 'Number',
    sortable: true
}
];

@api segContId ;
@track error;
@track contList ;
@track vendList = [];
@track vendListN;
@track segmentIdforTDE;
@track TDlist;



handleClickLink(event){
    this.viewSegmentRecord = true;
    this.viewDEPO = false;
    this.isRWAComp = false;
    this.segContId = event.target.getAttribute("data-id");
    this.segmentId = event.target.getAttribute("data-id");
    this.segmentIdforSC = this.segmentId;
this.segmentIdforTDE = this.segmentId.slice(0,-3);
    
    console.log('Event record Id 822 = '+this.segmentIdforSC); 
    console.log('Event record Id 823 = '+this.segmentIdforTDE); 

    validateDepoCheckInStatus({ 
        recordIdDepo : this.segmentId
    })
    
    .then(result => {  
       console.log('recordIdDepo = '+this.segmentId);
       console.log('result Depo Status'+JSON.stringify(result));
       this.isRWA = true;
       console.log('result Indora= '+result);
       if(result === true){
        this.isCheckInOutShow = false;
        this.isCheckInShow = true; 
        console.log('isCheckInOutShow = '+ this.isCheckInOutShow);
        this.viewSegmentRecord = true;
        this.showAfterSave = false;
       }
       else{
        this.isCheckInOutShow = true;
        this.isCheckInShow = false;   
        console.log(' this.isCheckInShow = '+ this.isCheckInShow);
        this.viewSegmentRecord = true;
        this.showAfterSave = true;
       }
        
    })

    recordTypeSegmentContact()
        .then(result => {
            this.recordTypeSegC = result;
            
        })
        .catch(error => {
              
        });
        recordTypeSegmentContactVendor()
        .then(result => {
            this.recordTypeSegV = result;
        })
        .catch(error => {
              
        });

    getSegmentContacts({ segmentIdforSegContacts : this.segContId}) 
           .then(results => { 
            console.log('Ashish true record Id = '+results); 

                   this.contList = results;  

                   })
                   .catch(error => {
                    console.log('Ashish error record Id = '+error); 

                   this.error = error;

                   }

                
           );

       

           displaySegmentContactVendor({segmentIdforSegCntcts : this.segContId})
           .then(results => { 
            console.log('Ashish true record Id = '+results); 

                   this.vendList = results;  

                   })
                   .catch(error => {
                    console.log('Ashish error record Id = '+error); 

                   this.error = error;

                   }
           );

           

           //Fetch Transaction Details Data
           console.log('Seg cont Id 1839 = '+this.segContId); 

           
           this.viewTsnDetailrecords();

       }

      //transaction details component start 
       @wire(getTypes, {})
    WiredObjects_Type({ error, data }) {
 
        if (data) {
            try {
                this.l_All_Types = data; 
                let options = [];
                 
                for (var key in data) {
                    // Here key will have index of list of records starting from 0,1,2,....
                    options.push({ label: data[key].Name, value: data[key].Id  });
 
                    // Here Name and Id are fields from sObject list.
                }
                this.TypeOptions = options;
                 
            } catch (error) {
                console.error('check error here', error);
            }
        } else if (error) {
            console.error('check error here', error);
        }
 
    }
 
//transaction details component end
     
// DYNAMIC ROW ADD AND REMOVE CODE Start PART2
handleNameChangeNew1(event){
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList1[key];
    this.SCList1[key].Name = event.target.value;
}
handleEmailChangeNew1(event){
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList1[key];
    this.SCList1[key].Email__c = event.target.value;
}
handlePhoneChangeNew1(event){
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList1[key];
    this.SCList1[key].Phone__c = event.target.value;
}
handleDesignationChangeNew1(event){
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList1[key];
    this.SCList1[key].Designation__c = event.target.value;
    this.SCList1[key].Segment__c = this.segmentIdforSC;
    this.SCList1[key].RecordTypeId = this.recordTypeSegC;
}


handleNameChange(event) {
    var selectedRow = event.currentTarget;
   // var key = selectedRow.dataset.id;
   // var accountVar = this.SCList[key];
   // this.SCList[key].Name = event.target.value;
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
    var sdf =  event.target.value;
    this.conName = sdf;
    console.log('--this.conName--@@'+this.conName);
}


handleEmailChange(event) {
    /*this.acc.AccountNumber = event.target.value;
    console.log("AccountNumber", this.acc.AccountNumber);*/
    var selectedRow = event.currentTarget;
   // var key = selectedRow.dataset.id;
   // var accountVar = this.SCList[key];
   // this.SCList[key].Email__c = event.target.value;
    var sdf =  event.target.value;
    this.conEmail = sdf;
    console.log('--this.conName--@@'+this.conEmail);
}

handlePhoneChange(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
  //  var selectedRow = event.currentTarget;
   // var key = selectedRow.dataset.id;
  //  var accountVar = this.SCList[key];
   // this.SCList[key].Phone__c = event.target.value;
   var selectedRow = event.currentTarget;
   var sdf =  event.target.value;
   this.conPhone = sdf;
   console.log('--this.conName--@@'+this.conPhone);
    
}

handleDesignationChange(event) {
  
    var selectedRow = event.currentTarget;
    var sdf =  event.target.value;
    this.conDesignation = sdf;
    console.log('--this.conName--@@'+this.conDesignation);
}

handleNameChangeVendNew1(event) {
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList1[key];
    this.SVList1[key].Name = event.target.value;
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
}
handleEmailChangeVendNew1(event) {
    /*this.acc.AccountNumber = event.target.value;
    console.log("AccountNumber", this.acc.AccountNumber);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList1[key];
    this.SVList1[key].Email__c = event.target.value;
}

handlePhoneChangeVendNew1(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList1[key];
    this.SVList1[key].Phone__c = event.target.value;
    
}

handleDesignationChangeVendNew1(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList1[key];
    this.SVList1[key].Designation__c = event.target.value;
    this.SVList1[key].Segment__c = this.segmentIdforSC;
    this.SVList1[key].RecordTypeId = this.recordTypeSegV;
}



handleNameChangeVend(event) {
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList[key];
    this.SVList[key].Name = event.target.value;
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
}
handleEmailChangeVend(event) {
    /*this.acc.AccountNumber = event.target.value;
    console.log("AccountNumber", this.acc.AccountNumber);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList[key];
    this.SVList[key].Email__c = event.target.value;
}

handlePhoneChangeVend(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList[key];
    this.SVList[key].Phone__c = event.target.value;
    
}

handleDesignationChangeVend(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SVList[key];
    this.SVList[key].Designation__c = event.target.value;
    this.SVList[key].Segment__c = this.segmentIdforSC;
    this.SVList[key].RecordTypeId = this.recordTypeSegV;
}

saveRecordNewRec1(){

    saveSegmentContacts({accList : this.SCList1})
    .then(result => {
        this.message = result;
        this.error = undefined;
        if(this.message !== undefined) {
            this.scc1.Name = '';
            this.scc1.Email__c = '';
            this.scc1.Phone__c = '';
            this.scc1.Designation__c = '';
            this.scc1.RecordTypeId = '';
            this.scc1.Segment__c = '';
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Record created successfully',
                    variant: 'success',
                }),
            );
        }
        
        console.log(JSON.stringify(result));
        console.log("result", this.message);
        /*console.log(' After adding Record List ', result);
        this.accountList = result;
        console.log(' After adding Record List ', this.accountList);*/
    })
    .catch(error => {
        this.message = undefined;
        this.error = error;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error creating record',
                message: error.body.message,
                variant: 'error',
            }),
        );
        console.log("error", JSON.stringify(this.error));
    });

}

lookupRecord(event){
    var vendorCodeDtail =event.detail.selectedRecord;
    this.vendorCodeId = vendorCodeDtail.Id;
    console.log('--vendorCodeDtail--2--@@@@'+vendorCodeDtail.Id);
    console.log('--vendorCodeDtail--3--@@@@'+vendorCodeDtail);
    
}
saveRecordVendors(event){
    console.log('--this.vendorCodeId- @@-',this.vendorCodeId);
     var accId = this.vendorCodeId;
      if(accId == undefined ){
          console.log('--this.vendorCodeId---IN If --@@@@@@@----',accId);
  
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error creating record',
                  message: 'Please select Business Partner for this segment',
                  variant: 'error',
              }),
          );
         
      }
      else {
          console.log('--Else-@@@@@@@----',this.vendorCodeId);
          this.saveRecord(event);
         
      }
  
  }

saveRecord(event){ 
    var conForm ;
    var contDesignation= '';
    var vendorId= '';

    var contName = this.conName;
    var contEmail = this.conEmail;
    var contPhone = this.conPhone;
    var confirmSave = false;
    if(this.ShowRowSC ){
        contDesignation  = this.conDesignation;  
        conForm = 'Contact';
        console.log('--contPhone--IN--@@@@'+contPhone);
        console.log('--contName--IN--@@@@'+contName+ '---contDesignation--@@--'+contDesignation);
        if( contName != 'undefined' && contDesignation != '' && contPhone != undefined ){
            confirmSave = true;
            console.log('--contPhone--IN--@@@@'+contPhone);
         
          if(contPhone.length < 10 || contPhone.length > 10){
       
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Please Enter Validate Mobile Number.',
                variant: 'error',
            }),
            
        );
        confirmSave = false;
        }
        else{
           confirmSave = true;
        } 
     

    }
    else{
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Please Enter Required * Information.',
                variant: 'error',
            }),
            
        );
        confirmSave = false;
    }
    }
    if(this.ShowRowSV){
        console.log('--this.vendorCodeId----@@@@'+this.vendorCodeId);
        vendorId = this.vendorCodeId;
        conForm = 'Vendor';
       if(this.vendList.length > 0){
        for(var j=0; j< this.vendList.length; j++){
            console.log('-- this.vendList--'+ JSON.stringify(this.vendList[j].Business_Partner__c));
              if(this.vendList[j].Business_Partner__c == vendorId ){
                confirmSave = false;

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'This Business Partner already added on this segment.',
                        variant: 'error',
                    }),
                    
                );
                break;
                
              }
              else{
                confirmSave = true;
              }
        }
    }
    else{
        confirmSave = true;
    }
    }
   
   if(confirmSave == true){
    var contDesignation = this.conDesignation;
   // var segId = this.segmentId;
   if(this.newRecordView == true) {
     this.segmentId = this.recordIdNewSeg;
    }
   
    var segId = this.segmentId;
   
    saveSegmentContacts({
        name : contName,
        email : contEmail,
        phone : contPhone,
        desigantion : contDesignation,
        businessId : vendorId,
        segmentId : segId,
        isFromCall : conForm

    
    })
        .then(result => {
            this.message = result;
            this.error = undefined;
            if(this.message != undefined) {
                this.ShowRowSC = false;
                this.showTable = false;
                this.scc.Name = '';
                this.scc.Email__c = '';
                this.scc.Phone__c = '';
                this.scc.Designation__c = '';
                this.scc.RecordTypeId = '';
                this.scc.Segment__c = '';
               
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record created successfully',
                        variant: 'success',
                    }),
                );
            }
            
            console.log(JSON.stringify(result));
            console.log("result", this.message);
            this.ShowRowSC = false;
            this.ShowRowSV = false;
            /*console.log(' After adding Record List ', result);
            this.accountList = result;
            console.log(' After adding Record List ', this.accountList);*/
            getSegmentContacts({ segmentIdforSegContacts : segId}) 
            .then(results => { 
             console.log('Ashish true record Id = '+results); 
             this.showTable = true;
                    this.contList = results;  
 
                    })
                    .catch(error => {
                     console.log('Ashish error record Id = '+error); 
 
                    this.error = error;
 
                    }
 
                 
            );

              
            displaySegmentContactVendor({segmentIdforSegCntcts : segId})
           .then(results => { 
            console.log('Shuham true record Id = '+JSON.stringify(results)); 
            
                   this.vendList = results;   

                   })
                   .catch(error => {
                    console.log('Ashish error record Id = '+error); 

                   this.error = error;

                   }
           );
                this.scc.Name = '';
                this.scc.Email__c = '';
                this.scc.Phone__c = '';
                this.scc.Designation__c = '';
                this.scc.RecordTypeId = '';
                this.scc.Segment__c = '';
                 this.ShowRowSC = false;

           
        })
        .catch(error => {
            this.message = undefined;
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
            console.log("error", JSON.stringify(this.error));
        });

    }
       

}


saveRecordVendNew1(){

    saveSegmentContacts({accList : this.SVList1})
    .then(result => {
        this.message = result;
        this.error = undefined;
        if(this.message !== undefined) {
            this.svv1.Name = '';
            this.svv1.Email__c = '';
            this.svv1.Phone__c = '';
            this.svv1.Designation__c = '';
            this.svv1.RecordTypeId = '';
            this.svv1.Segment__c = '';
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Record created successfully',
                    variant: 'success',
                }),
            );
        }
        
        console.log(JSON.stringify(result));
        console.log("result", this.message);
        /*console.log(' After adding Record List ', result);
        this.accountList = result;
        console.log(' After adding Record List ', this.accountList);*/
    })
    .catch(error => {
        this.message = undefined;
        this.error = error;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error creating record',
                message: error.body.message,
                variant: 'error',
            }),
        );
        console.log("error", JSON.stringify(this.error));
    });

}

saveRecordVend(){  
    //console.log('582 record Id = '+this.segmentIdforSC);
         
    saveSegmentContacts({accList : this.SVList})
        .then(result => {
            this.message = result;
            this.error = undefined;
            if(this.message !== undefined) {
                this.scc.Name = '';
                this.scc.Email__c = '';
                this.scc.Phone__c = '';
                this.scc.Designation__c = '';
                this.scc.RecordTypeId = '';
                this.scc.Segment__c = '';
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record created successfully',
                        variant: 'success',
                    }),
                );
            }
            
            console.log(JSON.stringify(result));
            console.log("result", this.message);
            /*console.log(' After adding Record List ', result);
            this.accountList = result;
            console.log(' After adding Record List ', this.accountList);*/
        })
        .catch(error => {
            this.message = undefined;
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
            console.log("error", JSON.stringify(this.error));
        });
}


// DYNAMIC ROW ADD AND REMOVE CODE ENDS PART2
handleTSNameChange(event) {
    this.tdNewsp = event.target.value;
    console.log('Name value = '+ this.tdNewsp);
  /*  var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.TSList[key];
    this.TSList[key].Name = event.target.value;*/
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
}

handleTSFTDChange(event) {
    this.ftdcount = event.target.value;
    
   /* var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.TSList[key];
    this.TSList[key].FTD_Count__c = event.target.value;
    this.TSList[key].Segment__c = this.segmentIdforSC;*/
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
}
/*
handleTSLVDChange(event) {
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.TSList[key];
    this.TSList[key].Last_Visit__c = event.target.value;
    this.TSList[key].Segment__c = this.segmentIdforSC;
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
}
handleTS2LVDChange(event) {
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.TSList[key];
    this.TSList[key].Second_Last_Visit__c = event.target.value;
   // this.TSList[key].Segment__c = this.segmentIdforSC;
}

*/
saveRecordTS(){ 
    var abc = {
        'sId':this.segmentIdforSC ,
         'FTDCount': this.ftdcount,
          'newsPaper': this.tdNewsp
       }
       console.log('--this.viewTransactionData--@@--'+JSON.stringify(this.viewTransactionData));
      var flag = false;
       for(var j=0; j< this.viewTransactionData.length; j++){
         if(this.tdNewsp == this.viewTransactionData[j].name){
            flag = true;
            this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Already Selected this News Paper',
                variant: 'error',
            }),
            );
    
         }
    
       }
    
       if(flag == false){
        this.newNewsPaperInsert.push( abc );
        console.log('===this.newNewsPaperInsert==='+this.newNewsPaperInsert);
        //this.viewTsnDetailrecords();
        var result = this.viewTransactionData;
        var selectedSaveRecords =  this.newNewsPaperInsert;
                if(selectedSaveRecords.length > 0){
                    var abc =[];
                    var bca;
                    for(var j=0; j< selectedSaveRecords.length; j++){
                
                        console.log('-selectedSaveRecords-'+ selectedSaveRecords[j]);
                        bca = {
                          "count" : 0,
                          "ftdcount" : parseInt(selectedSaveRecords[j].FTDCount),
                          "lastdate":0,
                          "name" : selectedSaveRecords[j].newsPaper,
                          "secondlastdate":0
                         
                        }
                       
                       console.log('--abc---ABC--333-In Side--',JSON.stringify(bca));
                       }
                       console.log('--abc---ABC--333--out side--'+JSON.stringify(bca));
                       result.push(bca);
                       console.log('--this.result.dataTable--New---',JSON.stringify(result));
                  
                   
                  
                }
              
               
                this.viewTransactionData = result;
                console.log('--result.dataTable-1111111111--',JSON.stringify(this.viewTransactionData));
                this.CreateTSrecord = false;
               
}
}
handleRowAction(event){
    
    const row = event.detail.row;
    
     
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    actionName: 'edit'
                }
            });
            
    
   

}


handleRowActionV1(event){
    
    const row = event.detail.row;
    
     
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id,
                    actionName: 'edit'
                }
            });
            
        } 


   

    onSearchAgainSegmentView(){
        this.isRWAComp = true;
        this.viewSegmentRecord=false; 
        this.createSegConContact = false;  
        this.createSegConVendor = false;  
        this.searchValueRWA = '';
        this.segmentRecord = null;
    }

    onCancelSegmentView(){
       this.viewOneApp = true;
       this.isOOH = true;
       this.isCSP = true;
       this.isDEPO = true;
       this.isRWAComp = true;
       this.viewSegmentRecord=false; 
       this.createSegConContact = false;  
       this.createSegConVendor = false;
       this.searchValueRWA = '';
       this.segmentRecord = null;
       this.newRecordView = false;
    }

   
    saveSegConContact(event){
        this.recordId = event.detail.id;
        console.log('recordId215 '+this.recordId);
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'Segment Contact Record Has Been Created',
                    variant: 'success'
                })
            );
            this.viewSegConContact = true;
            this.createSegConContact = false;       
        }
        else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: 'Complete The Details',
                    variant: 'error'
                })
            ); 
            
        }
    }  
    
    onBackCreateSegConContact(){
        this.viewSegConContact = false;
        this.createSegConContact = true;
    }
    

    saveSegConVendor(event){
        this.recordId = this.segmentIdforTDE.slice(0, -3);
    
        console.log('recordId241 '+this.recordId);
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'Segment Contact Record Has Been Created',
                    variant: 'success'
                })
            );
             
        }
        else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: 'Complete The Details',
                    variant: 'error'
                })
            ); 
            
        }
    }

    onBackCreateSegConVendor(){
        this.viewSegConVendor = false;
        this.createSegConVendor = true; 
    }
    //Code Start For Geo Location Tracking for RWA
    //callback after the component renders
    handleGetCurrentLocationClick() {
        console.log('>>> in rendered callback---1822');
        if(!this.isRendered){
            this.getCurrentBrowserLocation();
        }
        //sets true once the location is fetched
        
        
    }

    getCurrentBrowserLocation() {
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        console.log('navigator.geolocation '+navigator.geolocation);
        if(navigator.geolocation) {
            //accessing getCurrentPosition method
            navigator.geolocation.getCurrentPosition((position)=> {
                //success callback
                console.log('>>>positions' + position);
                let currentLocation = {
                    location : {
                        Latitude: position.coords.latitude,
                        Longitude: position.coords.longitude
                    },
                    title : 'My location'
                };
                
                //this.isRendered = true;
                var recsetid; var rectypeid;
                if(this.depoId!='undefined'){
                    recsetid =  this.depoId;
                    console.log('recsetid 1 ='+recsetid);
                    rectypeid = null;                }
                else{
                    recsetid = this.segmentIdforSC;
                    console.log('recsetid 2 ='+recsetid);
                    rectypeid = this.recordTypeRWACheckin;
                }
                console.log('recsetid 3 ='+recsetid);

                checkInFromOneApp({
                    lat: position.coords.latitude, lng: position.coords.longitude, recordId : recsetid,
                    recordTypeCheckin : this.recordTypeRWACheckin
                })
                .then(result => {
                    console.log('recsult 4 ='+JSON.stringify(result));

                    this.checkInData = result;
                    console.log('--this.checkInData--',this.checkInData);
                    if(this.checkInData == 'success'){
                        this.isCheckInOutShow = true;
                        this.isCheckInShow = false;
                        this.isRendered = true;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'CSP Check-in Successful!!',
                            variant: 'success'
                        })
                    );
                    }
                    else{
                        this.isRendered = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'CSP Check-in failed!!',
                                message: 'Some Error Occured.',
                                variant: 'error'
                            })
                        );
                    }
                    this.showButton = true;
                    this.isRendered = true;
                    this.handleTDSave(event);
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Location Not Saved',
                            message: 'Checked In Unsuccessful Please Try Again',
                            variant: 'error'
                        })
                    ); 
                    this.isRendered = false;  
                });
                    insertTransactionDetails({
                        recordId : this.recordId    
                    })
                    .then(result => {
                        this.transactionData = result;
                        this.newTransactionDetails = true;
                    })
                    .catch(error => {
                        this.error = error;
                        this.newTransactionDetails = false;
                    });
                
            
                
            }, 
            (error) => {
                //error callback
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'LocationService Error',
                        message:
                            'There was a problem locating you: ' +
                            'Please Turn On Your Geo Location',
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
                this.isRendered = false;
            },             
            

            options);
        }
        
    }

    handleSaveTsn(event) {
        const recordInputs =  event.detail.draftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
    
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(result => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Transactions Record Updated',
                    variant: 'success'
                })
            );
             // Clear all draft values
             this.draftValues = [];
             this.reloadTsnDetailrecords();   
           
        }).catch(error => {
            // Handle error
        });
    }

    reloadTsnDetailrecords(){
        viewTransactionDetails({
            recordId : this.recordId    
        })
        .then(result => {
            this.transactionData = result;
        })
        .catch(error => {
            this.error = error;
        });
    }
    

    viewTsnDetailrecords(){
        console.log('viewTransactionDetailsSecondTime is called ');
        console.log('recordId is called '+this.segmentId );

      
        viewTransactionDetailsSecondTime({
          //  recordId : this.segmentId.slice(0,-3)  
          recordId : this.segmentId 
         
        })
        .then(result => {
            console.log('recordId value '+this.recordId );

            console.log('Trans Result1233 '+ JSON.stringify(result));
            var savedRecordsfromMand = JSON.stringify(result);
           
           // if Last vist blank and Is Covid unchecked 
            this.viewTransactionData = result.dataTable;
            console.log('--result.dataTable---',JSON.stringify(result.dataTable));
            this.lastDate = result.dataHeader.lastVisit;
            if(result.dataHeader.visitDate == null && result.dataHeader.covidCheck == false){
                this.showTableRWASecond = false;
                this.showTableForRWACovidCheck = false; 
                this.showTableForRWABothCheck = false; 
                this.showTableRWAFirst = true;
                console.log(' this.showTableRWAFirst--1--@@- '+ this.showTableRWAFirst );
            }

            // if Last vist blank and Is Covid checked 
            else if(result.dataHeader.visitDate == null && result.dataHeader.covidCheck == true ){
                this.showTableRWAFirst = false;
                this.showTableRWASecond = false;
                this.showTableForRWABothCheck = false; 
                this.showTableForRWACovidCheck = true;  
                console.log(' this.showTableForRWACovidCheck--2--@@- '+ this.showTableForRWACovidCheck );
               
            }
             // if Last vist not  blank and Is Covid unchecked 
            else if(result.dataHeader.visitDate != null && result.dataHeader.covidCheck == false){
                this.showTableRWAFirst = false;
                this.showTableForRWACovidCheck = false;
                this.showTableForRWABothCheck = false; 
                this.showTableRWASecond = true;
                console.log(' this.showTableRWASecond--3--@@- '+ this.showTableRWASecond );
            }

              // if Last vist not  blank and Is Covid checked 
              
            else if(result.dataHeader.visitDate != null && result.dataHeader.covidCheck == true){
                this.showTableRWAFirst = false;
                this.showTableRWASecond = false;
                this.showTableForRWACovidCheck = false;
                this.showTableForRWABothCheck = true; 
                console.log(' this.showTableForRWABothCheck--4--@@- '+ this.showTableForRWABothCheck );
                
            }
            else{
                this.showTableRWAFirst = true;
                console.log(' -- this.showTableRWAFirst@@- '+  this.showTableRWAFirst );
            }
            
            this.secondlastdate = result.dataHeader.secondLastVisit; 
            //console.log('last Date '+ this.lastDate);
        })
        .catch(error => {
            this.error = error;
        });
    }

    handleSaveViewTsn(event) {
        const recordInputs =  event.detail.draftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
    
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(result => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Transactions Record Updated',
                    variant: 'success'
                })
            );
             // Clear all draft values
             this.draftValuesTsn = [];
            this.viewTsnDetailrecords();
            
        }).catch(error => {
            // Handle error
        });
    }

    handleGetCurrentLocationClickRWA() {
        console.log('>>> in rendered callback 2088--');
        if(!this.isRendered){
            this.getCurrentBrowserLocationOn1();
        }
        //sets true once the location is fetched
        
        
    }

    getCurrentBrowserLocationOn1() {
        
        console.log('this.viewTransactionData1773 ' + JSON.stringify(this.viewTransactionData));
        var flag = true;
        // console.log('this.selectedRow ' + JSON.stringify(this.selectedRow));
        for(var j=0; j<this.viewTransactionData.length; j++){
            console.log('this.JJJ@@-- ' + JSON.stringify(this.viewTransactionData[j].ftdcount));
            if(this.viewTransactionData[j].ftdcount < 0 || this.viewTransactionData[j].ftdcount == '' || this.viewTransactionData[j].ftdcount == null){
                flag = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'FTD Count Can not be blank for news paper',
                        variant: 'error'
                    })
                );
                this.isRendered = false; 
            }
        }
           if(flag == true){
            console.log('--@@this.newNewsPaperInsert@@--'+this.newNewsPaperInsert);
            if(JSON.stringify(this.newNewsPaperInsert).length > 0 ){
            var options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            console.log('navigator.geolocation '+navigator.geolocation);
            if(navigator.geolocation) {  
                //accessing getCurrentPosition method
                navigator.geolocation.getCurrentPosition((position)=> {
                    //success callback
                    console.log('>>>positions' + position);
                    let currentLocation = {
                        location : {
                            Latitude: position.coords.latitude,
                            Longitude: position.coords.longitude
                        },
                        title : 'My location'
                    };
                   
                           
                    
                    
                    checkInSecondTime({
                        lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.segmentIdforSC,
                        recordTypeCheckin : this.recordTypeRWACheckin
                    })
                
                    .then(result => {
                        if(result != null){
    
                            this.checkInData = result;
                            console.log('--this.checkInData--',this.checkInData);
                            if(this.checkInData == 'success'){
                                this.isCheckInOutShow = true;
                                this.isCheckInShow = false;
                                this.isRendered = true;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'CSP Check-in Successful!!',
                                    variant: 'success'
                                })
                            );
                            }
                            else{
                                this.isRendered = false;
                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'CSP Check-in failed!!',
                                        message: 'Some Error Occured.',
                                        variant: 'error'
                                    })
                                );
                            }
                            this.showButton = true;
                            this.isRendered = true;
                            this.handleTDSave(event);
                        }
                        else{
                            // Use lable in message
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Location not in range',
                                    message: 'Your check in location not in 200 meter of approved check in location. Please check in from correct location',
                                    variant: 'error'
                                })
                            );
                            this.isRendered = false;      
                        }
                        
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Location Not Saved',
                                message: 'Checked In Unsuccessful Please Try Again',
                                variant: 'error'
                            })
                        );
                        this.isRendered = false;
                    });
    
    
                    
                }, 
                (error) => {
                    //error callback
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'LocationService Error',
                            message:
                                'There was a problem locating you: ' +
                                'Please Turn On Your Geo Location' +
                                'And Refresh The Page',
                            variant: 'error',
                            mode: 'sticky'
                        })
                    );
                    this.isRendered = false;
                }, 
                options);
            }
          
        }
    
    
          else{
            this.recordTypeRWACheckin ='RWA';
            console.log('Else Part for newss paper');
            var options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            console.log('navigator.geolocation '+navigator.geolocation);
            if(navigator.geolocation) {
                //accessing getCurrentPosition method
                navigator.geolocation.getCurrentPosition((position)=> {
                    //success callback
                    console.log('>>>positions' + position);
                    let currentLocation = {
                        location : {
                            Latitude: position.coords.latitude,
                            Longitude: position.coords.longitude
                        },
                        title : 'My location'
                    };
                   
                           
                    
                    
                    addedNonMandotryNewsPaper({
                        lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.segmentIdforSC,
                        recordTypeCheckin : this.recordTypeRWACheckin, stList : this.newNewsPaperInsert
                    })
                
                    .then(result => {
                        if(result=='success'){
                            this.showButton = true;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Location Detected',
                                    message: 'Checked In successfully.',
                                    variant: 'success'
                                })
                            );
                            this.isRendered = true;
                            this.handleTDSave(event);
                        }
                        else{
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Location Not Detected',
                                    message: 'Check In Cannot Be Done, Not Under Required Radius Of Previous Checked In',
                                    variant: 'error'
                                })
                            );
                            this.isRendered = false;      
                        }
                        
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Location Not Saved',
                                message: 'Checked In Unsuccessful Please Try Again',
                                variant: 'error'
                            })
                        );
                        this.isRendered = false;
                    });
    
    
                    
                }, 
                (error) => {
                    //error callback
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'LocationService Error',
                            message:
                                'There was a problem locating you: ' +
                                'Please Turn On Your Geo Location' +
                                'And Refresh The Page',
                            variant: 'error',
                            mode: 'sticky'
                        })
                    );
                    this.isRendered = false;
                }, 
                options);
            }
           
          }
        }
    
    }

    getCurrentBrowserLocationOn() {
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        console.log('navigator.geolocation '+navigator.geolocation);
        if(navigator.geolocation) {
            //accessing getCurrentPosition method
            navigator.geolocation.getCurrentPosition((position)=> {
                //success callback
                console.log('>>>positions' + position);
                let currentLocation = {
                    location : {
                        Latitude: position.coords.latitude,
                        Longitude: position.coords.longitude
                    },
                    title : 'My location'
                };
                
                checkInSecondTime({
                    lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.segmentIdforSC,
                    recordTypeCheckin : this.recordTypeRWACheckin
                })
                .then(result => {
                    if(result != null){
                        this.checkInData = result;
                        this.isRendered = false;
                        console.log('--this.checkInData--',this.checkInData);
                        if(this.checkInData == 'success'){
                            this.isCheckInOutShow = true;
                            this.isCheckInShow = false;
                            this.isRendered = true;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'CSP Check-in Successful!!',
                                variant: 'success'
                            })
                        );
                        this.isCheckInOutShow = true;
                        this.isCheckInShow = false;
                        this.isRendered = true;
                        console.log('--this.isCheckInOutShow--',this.isCheckInOutShow);

                        }
                        else{
                            this.isRendered = false;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'CSP Check-in failed!!',
                                    message: 'Some Error Occured.',
                                    variant: 'error'
                                })
                            );
                        }
                        console.log('--Rahu;--', this.isRendered);
                        this.showButton = true;
                        this.isRendered = true;
                        this.handleTDSave(event);
                        console.log('--Rahu1;--', this.isRendered);
                        
                    }
                    else{
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Location Not Detected',
                                message: 'Check In Cannot Be Done, Not Under Required Radius Of Previous Checked In',
                                variant: 'error'
                            })
                        );
                        this.isRendered = false;      
                    }
                    
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Location Not Saved',
                            message: 'Checked In Unsuccessful Please Try Again',
                            variant: 'error'
                        })
                    );
                    this.isRendered = false;
                });
                
            }, 
            (error) => {
                //error callback
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'LocationService Error',
                        message:
                            'There was a problem locating you: ' +
                            'Please Turn On Your Geo Location' +
                            'And Refresh The Page',
                        variant: 'error',
                        mode: 'sticky'
                    })
                );
                this.isRendered = false;
            }, 
            options);
        }
        
    }

    onBackToViewRAW(){
        this.createTransactionDetails = false;
        this.viewSegmentRecord = true;
    }
    
    addRow2(){
        getTDPicklistValues()
            .then(result => {
                console.log('company picklist 1 = '+JSON.stringify(result));
                 this.CompValues = result;
                
            })
            .catch(error => {
                  
            });
            console.log('get piclist getment id = '+ this.segmentId);
            getNeswpaperPicklist({ recordId :  this.segmentId})
            .then(result => {
                console.log(' Selected newspaper picklist @@ = '+JSON.stringify(result));
                 this.pickValue = result;
                 var abc =[];
                for(var j=0; j< this.pickValue.length; j++){
                    var bca = {
                      "label" : this.pickValue[j].label,
                      "value" : this.pickValue[j].value
                    }
                   abc.push(bca);
                   console.log('--this.pickValues---ABC--111---',JSON.stringify(abc));
                }
                this.pickValues = abc;
                console.log('--this.pickValues---ABC-----',JSON.stringify(abc));
                console.log('--this.pickValues--',JSON.stringify(this.pickValues)); 
                //this.PaperValues = result;
                this.handleChange(event);
                
            })
            .catch(error => {
                  
            });
            
           
            this.index1++;
            var i = this.index1;
           // this.ShowRowSV = true;
            this.CreateTSrecord = true;
            this.topFunction();
            //this.CreateTSrecordNew = true;
            this.tcc.key = i;
            this.tcc.Choose_Company__c = this.CompValues;
            this.tcc.Choose_Company__c = this.pickValues;
            this.TSList.push(JSON.parse(JSON.stringify(this.tcc)));
          console.log('TS LIST FOR ADD NEW = '+JSON.stringify(this.TSList));
           
        }

    handleTDSave(event){
    
        this.showTableRWASecond = false;
        this.showTableForRWACovidCheck = false; 
        this.showTableForRWABothCheck = false; 
        this.showTableRWAFirst = false;
        console.log('this.viewTransactionData1773 ' + JSON.stringify(this.viewTransactionData));
    
            txnVisitSave({ segmentId : this.segmentId, selectedRow: this.viewTransactionData })
            .then(result => {      
                
                console.log('result1777' + JSON.stringify(result));  
                this.showTableRWAFirst = false;
               // this.showTableRWASecond = true;
               this.viewTsnDetailrecords();
    
                /* this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Transactions Record Updated',
                        variant: 'success'
                    })
                ); */
            })
            .catch(error => {
                this.error = error;
            });
    
            
    }
    
    handleEditTD(event){
        let itemIndex = event.target.getAttribute("data-id");  
        let val = event.target.value;
    
        let dataList = [];
        dataList = this.viewTransactionData;
    
        dataList[itemIndex].ftdcount = val;
        this.viewTransactionData = dataList;
    
        console.log('dataList1768 ' + JSON.stringify(dataList));
        console.log('this.viewTransactionData1769 ' +JSON.stringify(this.viewTransactionData));
    }

    viewTsnDetailrecords(){
        console.log('viewTransactionDetailsSecondTime is called ');
        console.log('recordId is called '+this.segmentId );

      
        viewTransactionDetailsSecondTime({
          //  recordId : this.segmentId.slice(0,-3)  
          recordId : this.segmentId 
         
        })
        .then(result => {
            console.log('recordId value '+this.recordId );

            console.log('Trans Result1233 '+ JSON.stringify(result));
            var savedRecordsfromMand = JSON.stringify(result);
           /* var selectedSaveRecords =  this.newNewsPaperInsert;
            if(selectedSaveRecords.length > 0){
                var abc =[];
                for(var j=0; j< selectedSaveRecords.length; j++){
            
                    console.log('-selectedSaveRecords-'+ selectedSaveRecords[j]);
                    var bca = {
                      "count" : 0,
                      "ftdcount" : parseInt(selectedSaveRecords[j].FTDCount),
                      "lastdate":0,
                      "name" : selectedSaveRecords[j].newsPaper,
                      "secondlastdate":0
                     
                    }
                   //parseInt(selectedSaveRecords[j].FTDCount)
                   abc.push(bca);
                   console.log('--abc---ABC--333---',JSON.stringify(bca));
                 result.dataTable.push(bca);
                
                   console.log('--this.result.dataTable--New---',JSON.stringify(result.dataTable));
                }
               
              
            }
          
           
            

            console.log(' this.result.dataHeader.covidCheck----@@- '+ result.dataHeader.covidCheck );
            console.log(' result.dataHeader.visitDate--121--@@- '+result.dataHeader.visitDate );
            console.log(' result.dataHeader.visitDate--122--@@- '+result.dataHeader.covidCheck ); */
            
           // if Last vist blank and Is Covid unchecked 
            this.viewTransactionData = result.dataTable;
            console.log('--result.dataTable---',JSON.stringify(result.dataTable));
            this.lastDate = result.dataHeader.lastVisit;
            if(result.dataHeader.visitDate == null && result.dataHeader.covidCheck == false){
                this.showTableRWASecond = false;
                this.showTableForRWACovidCheck = false; 
                this.showTableForRWABothCheck = false; 
                this.showTableRWAFirst = true;
                console.log(' this.showTableRWAFirst--1--@@- '+ this.showTableRWAFirst );
            }

            // if Last vist blank and Is Covid checked 
            else if(result.dataHeader.visitDate == null && result.dataHeader.covidCheck == true ){
                this.showTableRWAFirst = false;
                this.showTableRWASecond = false;
                this.showTableForRWABothCheck = false; 
                this.showTableForRWACovidCheck = true;  
                console.log(' this.showTableForRWACovidCheck--2--@@- '+ this.showTableForRWACovidCheck );
               
            }
             // if Last vist not  blank and Is Covid unchecked 
            else if(result.dataHeader.visitDate != null && result.dataHeader.covidCheck == false){
                this.showTableRWAFirst = false;
                this.showTableForRWACovidCheck = false;
                this.showTableForRWABothCheck = false; 
                this.showTableRWASecond = true;
                console.log(' this.showTableRWASecond--3--@@- '+ this.showTableRWASecond );
            }

              // if Last vist not  blank and Is Covid checked 
              
            else if(result.dataHeader.visitDate != null && result.dataHeader.covidCheck == true){
                this.showTableRWAFirst = false;
                this.showTableRWASecond = false;
                this.showTableForRWACovidCheck = false;
                this.showTableForRWABothCheck = true; 
                console.log(' this.showTableForRWABothCheck--4--@@- '+ this.showTableForRWABothCheck );
                
            }
            else{
                this.showTableRWAFirst = true;
            }
            
            this.secondlastdate = result.dataHeader.secondLastVisit; 
            console.log('last Date '+ this.lastDate);
        })
        .catch(error => {
            this.error = error;
        });
    }

    checkOutFromOneApp(){
        console.log('>>> in checkOutFromOneApp');
        
    
            var options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            console.log('navigator.geolocation '+navigator.geolocation);
     
            if(navigator.geolocation) {
                //accessing getCurrentPosition method
                navigator.geolocation.getCurrentPosition((position)=> {
                    //success callback
                    console.log('>>>positions' + position);
                    let currentLocation = {
                        location : {
                            Latitude: position.coords.latitude,
                            Longitude: position.coords.longitude
                        },
                        title : 'My location'
                    };
                    if(this.selectedDeviceId != this.mobileId){
    
                    }
                    //this.isRendered = true;
                    checkOutFromOneApp({
                        lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.segmentId,
                        recordTypeCheckin : this.recordTypeRWACheckin, userIds : this.loggedInUserId, deviceNM :  this.deviceName
                    })
                    .then(result => {
                        console.log('--this.Rahul-1688-',this.mobileId);
                        this.checkInData = result;
                        console.log('--this.checkInData--',this.checkInData);
                        if(this.checkInData == 'Check Out Success'){
                            this.isCheckInOutShow = true;
                            this.isCheckInShow = false;
                            this.isRendered = true;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'CSP Check-Out Successful!!',
                                variant: 'success'
                            })
                        );
                        this.dispatchEvent(new RefreshEvent());
                        }
                        else{
                            this.isRendered = false;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'CSP Check-Out failed!!',
                                    message: 'Some Error Occured.',
                                    variant: 'error'
                                })
                            );
                        }
                       
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Location Not Saved',
                                message: 'Checked Out Unsuccessful Please Try Again',
                                variant: 'error'
                            })
                        ); 
                        this.isRendered = false;  
                    });
    
                    insertTransactionDetails({
                        recordId : this.recordId    
                    })
                    .then(result => {
                        this.transactionData = result;
                        this.newTransactionDetails = true;
                    })
                    .catch(error => {
                        this.error = error;
                        this.newTransactionDetails = false;
                    });
                    
                }, 
                (error) => {
                    //error callback
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'LocationService Error',
                            message:
                                'There was a problem locating you: ' +
                                'Please Turn On Your Geo Location',
                            variant: 'error',
                            mode: 'sticky'
                        })
                    );
                    this.isRendered = false;
                }, 
                options);
            }
         
    }
}