import { LightningElement,track,api,wire } from 'lwc';
import USER_ID from '@salesforce/user/Id'; //retreive the USER ID of current logged in user.
import displaySegmentsRWA from '@salesforce/apex/SegmentController.displaySegmentsRWA';
import displaySegmentsOOH from '@salesforce/apex/SegmentController.displaySegmentsOOH';
import displaySegmentsCSP from '@salesforce/apex/SegmentController.displaySegmentsCSP';
import displaySegmentsDEPO from '@salesforce/apex/SegmentController.displaySegmentsDEPO';
import displaySegmentContactVendor from '@salesforce/apex/SegmentController.getSegmentContactVendor';
import { NavigationMixin } from 'lightning/navigation';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import checkInFromOneApp from '@salesforce/apex/GeolocationController.checkInFromOneAppForDepo';
import checkOutFromOneAppDepo from '@salesforce/apex/GeolocationController.checkOutFromOneAppDepot'; 
import validateDepoCheckInStatus from '@salesforce/apex/GeolocationController.validateDepoCheckInToday'; 


import erroLogCreate from '@salesforce/apex/GeolocationController.erroLogCreate';
import recordTypeRWA from '@salesforce/apex/SegmentController.recordTypeRWA';
import recordTypeOOH from '@salesforce/apex/SegmentController.recordTypeOOH';
import recordTypeCSP from '@salesforce/apex/SegmentController.recordTypeCSP';
import recordTypeSegmentContact from '@salesforce/apex/SegmentController.recordTypeSegmentContact';
import recordTypeSegmentContactVendor from '@salesforce/apex/SegmentController.recordTypeSegmentContactVendor';
import getSegmentContacts from '@salesforce/apex/SegmentController.getSegmentContacts';
import checkInSecondTime from '@salesforce/apex/GeolocationController.checkInSecondTime';
import insertTransactionDetails from '@salesforce/apex/GeolocationController.insertTransactionDetails';
import { updateRecord } from 'lightning/uiRecordApi';
import viewTransactionDetails from '@salesforce/apex/GeolocationController.viewTransactionDetails';
import viewTransactionDetailsSecondTime from '@salesforce/apex/GeolocationController.viewTransactionDetailsSecondTime';
import SEGMENT_CONTACT_OBJECT from '@salesforce/schema/Segment_Contact__c';
import NAME_FIELD from '@salesforce/schema/Segment_Contact__c.Name';
import EMAIL_FIELD from '@salesforce/schema/Segment_Contact__c.Email__c';
import PHONE_FIELD from '@salesforce/schema/Segment_Contact__c.Phone__c';
import DESIGNATION_FIELD from '@salesforce/schema/Segment_Contact__c.Designation__c';
import SEGMENT_FIELD from '@salesforce/schema/Segment_Contact__c.Segment__c';
import saveSegmentContacts from '@salesforce/apex/SegmentController.saveSegmentContacts';
import TRANSACTIONAL_DETAIL_OBJECT from '@salesforce/schema/Transactional_Details__c';
import TSNAME_FIELD from '@salesforce/schema/Transactional_Details__c.Name';

import COMPANY_FIELD from '@salesforce/schema/Transactional_Details__c.Choose_Company__c';
import NEWSPAPER_FIELD from '@salesforce/schema/Transactional_Details__c.Choose_Newspaper__c';
import TSFTD_FIELD from '@salesforce/schema/Transactional_Details__c.FTD_Count__c';
import TSLASTVISIT_FIELD from '@salesforce/schema/Transactional_Details__c.Last_Visit__c';
import TSSECONDLAST_FIELD from '@salesforce/schema/Transactional_Details__c.Second_Last_Visit__c';

//import TSVD_FIELD from '@salesforce/schema/Transactional_Details__c.Visit_Date__c';
import TSSEGMENT_FIELD from '@salesforce/schema/Transactional_Details__c.Segment__c';

import saveTransDetail from '@salesforce/apex/SegmentController.saveTransDetail';
import getTypes from '@salesforce/apex/SegmentController.getTypes';
import getTDPicklistValues from '@salesforce/apex/SegmentController.getTDPicklistValues';
import userId from '@salesforce/user/Id';


//import recordTypeDEPO from '@salesforce/apex/SegmentController.recordTypeDEPO';

const { userAgent }  =  navigator;
const columns = [ { label: 'Segment Contact Name', fieldName: 'Name'},
                  { label: 'Email', fieldName: 'Email__c'},
                  { label: 'Phone', fieldName: 'Phone__c', type: 'phone'},
                  
                  { label: 'Designation', fieldName: 'Designation__c'},
                ];
/*const COLUMNS = [{
        label: 'Name', fieldName: 'recordLink', sortable: "true",type: 'url',
        typeAttributes: {
            label: {
                fieldName: 'Name',tooltip:"Name", target: "_blank"
            }
        }
    },
    {label: 'Slab', fieldName: 'Slab__c', sortable: "true", type: 'text'},
    {label: 'Category', fieldName: 'Category__c', sortable: "true" , type: 'text'},
    {label: 'Name Of Society', fieldName: 'Name_of_Society__c', sortable: "true", type: 'text'}  
    
    
];*/

const actions = [
   /* { label: 'View', name: 'view' },*/
    { label: 'Edit', name: 'edit', iconName: 'utility:edit' },
];
const columnsTSN =[
    { label: 'Name Of Newspaper', fieldName: 'Name', sortable: "true", type: 'text' },
    {  label: 'FTD Count', fieldName: 'FTD_Count__c', sortable: "true",editable: true },
];

export default class OneAppLwc extends NavigationMixin(LightningElement) {
   @track loggedInUserId= userId;
   
    @track l_All_Types;
    @track TypeOptions;

    @api objectApiName;
    @api recordId;
    @api recordIdSegC
    //@track lstColumns=COLUMNS;
    @track viewOneApp = true;
    @track recordTypeId;
    @track isRWAComp=false;
    @track isRWA=true;
    @track isOOH=true;
    @track isDEPO=true;
    @track isCSP=true;
    

    @track isCheckInOutShow=false;
    @track isCheckInShow=true;
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
    @track isCSPComp = false;
    @track viewSegmentRecordCSP = false;
    @track newCSPRecord = false;
    @track newRecordView = false;
    @track newOOHRecordView = false;
    @track newCSPRecordView = false;
    @track viewSegmentRecordDEPO = false;
    @track viewDEPO = true;
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
    @track columnsTSN = columnsTSN;
    @track viewTransactionData;
    @track ViewSegmentContactAfterCreate =false;
   
    @track Picklist_Value
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

    @track TDPList = [];
    @track TSList = [];
    @track TSname = TSNAME_FIELD;
    @track TScomp = COMPANY_FIELD;
    @track TSnewsp = NEWSPAPER_FIELD;


    @track ftd = TSFTD_FIELD;
   // @track visitDate = TSVD_FIELD;
    @track TSSegement = TSSEGMENT_FIELD;
    @track CreateTSrecord = false;
    @track CreateTSrecordNew = false;
  //  @track TSLastVisit = TSLASTVISIT_FIELD;
   // @track TSSecondLast = TSSECONDLAST_FIELD;
    @track lastDate;
    @track checkInData;
    @track mobileId;
    @track selectedDeviceId = null;
    @track deviceName;
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
    tcc1 = {
     //   Name : this.TSname,
     //   @track TSnewsp = NEWSPAPER_FIELD;

     Choose_Newspaper__c : this.TSnewsp,
        Choose_Company__c : this.TScomp,
        FTD_Count__c : this.ftd,
       // Visit_Date__c : this.visitDate,
        Segment__c : this.TSSegement,
        //Last_Visit__c : this.TSLastVisit?this.TSLastVisit : "",
        //Second_Last_Visit__c : this.TSSecondLast?this.TSSecondLast : "",
        key :''
    }

    tcc = {
        Name : this.TSname,
        Choose_Company__c : this.TScomp,
        Choose_Newspaper__c : this.TSnewsp,
        FTD_Count__c : this.ftd,
        Segment__c : this.TSSegement,
        key :''
    }

    tdp ={
        Name : this.TSname,
        FTD_Count__c : this.ftd,
       // Visit_Date__c : this.visitDate,
        Segment__c : this.TSSegement,
        //Last_Visit__c : this.TSLastVisit?this.TSLastVisit : "",
        //Second_Last_Visit__c : this.TSSecondLast?this.TSSecondLast : "",
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
        
    }

    addRow1(){

        this.index1++;
        var i = this.index1;
        this.ShowRowSV = true;
        this.svv.key = i;
        this.SVList.push(JSON.parse(JSON.stringify(this.svv)));

       
    }


    handleTypeChange(event){
        this.index1++;
        var i = this.index1;
       // this.ShowRowSV = true;
        this.CreateTDPub = true;
        this.tdp.Name = event.target.value;
        this.tdp.key = i;
        this.TDPList.push(JSON.parse(JSON.stringify(this.tdp)));
     /*   var Picklist_Value = event.target.value; 
        var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.TSList[key];
    this.TSList[key].Name = event.target.value;

        // Do Something.*/
    }
    
    @track openmodel = false;
    openModal() {
        this.openmodel = true;

       

    }
    closeModal() {
        this.openmodel = false
    } 
  /*  @track company;
    @track newspaper;
    @track ftdc;
    @track segment;
    @track rec = {
        company : this.status,
        newspaper : this.newspaper,
        ftdc : this.ftdc,
        segment : this.segment,
        }*/
        connectedCallback(){

           console.log('Caling Device',this.isWindows);
           
        this.generateFingerprint();
       
   
            console.log('--loggedInUserId--'+ this.loggedInUserId);
            let machineId = localStorage.getItem('MachineId');
            console.log('--this.deviceName --'+ this.deviceName );
           if (!machineId) {
              //  machineId = crypto.randomUUID();
             // localStorage.setItem('MachineId', machineId);
            }
            this.mobileId = machineId;  

             console.log('---machineId-- 28.5514994     77.2067953 -',machineId);

            displaySegmentsDEPO({ 
                Id:  this.loggedInUserId //pass id of the user  USER_ID, for testing use - 0057F000004GzygQAC
                
            })
            
            .then(result => {  
                console.log('USER_ID depo = '+USER_ID);
               console.log('result52'+JSON.stringify(result));
                this.depoSegmentRecord = result;   
                console.log('this.depoSegmentRecord = '+JSON.stringify(this.depoSegmentRecord)); 
            })
        
            this.viewDEPO = true;
            this.isDEPO=true;
            this.isOOH=false;
            this.isCSP=false;
            this.isRWA=false;
          
       } 
       

        generateFingerprint() {
        var fingerprint = [];
      
        // User agent
        fingerprint.push(navigator.userAgent);
      
        // Available screen resolution
        fingerprint.push(screen.width + 'x' + screen.height);
      
        // Available color depth
        fingerprint.push(screen.colorDepth);
      
        // Timezone offset
        fingerprint.push(new Date().getTimezoneOffset());
      
        // Available browser plugins
        var plugins = [];
        for (var i = 0; i < navigator.plugins; i++) {
          plugins.push(navigator.plugins[i].name);
      fingerprint.push(plugins.join(','));
      
        // Language preferences
        fingerprint.push(navigator.language);
      
        // Additional custom checks or information can be added here
      
        // Generate a hash of the fingerprint array
        var hash = fingerprint.join('');
        var sha1 = new Hashes.SHA1().hex(hash);
        console.log('===', sha1);
        return sha1;
      }
    }
      
   
   get isWindows (){
    if(userAgent.match(/Windows/i) != null){
        this.deviceName = 'Windows';
        return userAgent.match(/Windows/i) != null;
    }
    else if (userAgent.match(/Android/i) != null){
        this.deviceName = 'Android';
        return userAgent.match(/Android/i) != null;
    }
    else if (userAgent.match(/iPhone|iPad/i) != null){
        this.deviceName = 'iPhone';
        return userAgent.match(/iPhone|iPad/i) != null;
    }
    else{
        this.deviceName = 'Other device';
    }
     
   
   
}

    saveTDNP() {
        this.index1++;
        var i = this.index1;
       // this.ShowRowSV = true;
       // this.CreateTSrecord = true;
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
            
      
        
      //  this.closeModal();
    }

    get options() {
        return [
            { label: 'New', value: 'new' },
            { label: 'In Progress', value: 'inProgress' },
            { label: 'Finished', value: 'finished' },
        ];
    }
    
   addRow2(){

    getTDPicklistValues()
        .then(result => {
            console.log('company picklist 1 = '+JSON.stringify(result));
             this.CompValues = result;
            
        })
        .catch(error => {
              
        });
        

        this.index1++;
        var i = this.index1;
       // this.ShowRowSV = true;
       // his.CreateTSrecord = true;
        this.CreateTSrecordNew = true;
        this.tcc.key = i;
        this.tcc.Choose_Company__c = this.CompValues;
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

    searchKeywordRWA(event) {
        this.searchValueRWA = event.target.value;
       
        if (this.searchValueRWA !== '') {
            displaySegmentsRWA({
                    searchkey: this.searchValueRWA
                })
                .then(result => {
                    // set @track contacts variable with return contact list from server  
                   console.log('result52'+JSON.stringify(result));
                   console.log('result.length'+result.length);
                /*    var tempSegList = [];  
                    for (var i = 0; i < result.length; i++) {  
                     let tempRecord = Object.assign({}, result[i]); //cloning object  
                     tempRecord.recordLink = "/" + tempRecord.Id;  
                     tempSegList.push(tempRecord);  
                    }
                    this.segmentRecord = tempSegList;*/
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

    handleClickRwa(){
        this.isRWAComp = true;
        this.isOOH=false;
        this.isDEPO=false;
        this.isCSP=false;
        this.recordTypeRWACheckin ='RWA';

    }

    onBackClickRWA(){
        this.isRWAComp = false;
        this.isOOH=true;
        this.isDEPO=true;
        this.isCSP=true;
        this.segmentRecord = null;
        this.searchValueRWA = '';
        this.viewSegmentRecordOOH = false;
        this.dispatchEvent(new CustomEvent('depoback'));

    }

    navigateToNew() {
        this.newRecord=true;
        this.isRWAComp=false;
        recordTypeRWA()
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

   
  
    handleSubmitRWA(event){
        this.recordId = event.detail.id;
        this.segmentIdforSC = this.recordId.slice(0, -3);
       
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
            this.newRecordView = true;
            this.viewSegmentContact = true;
            this.viewSegmentVendor = true;
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

    handleSubmitSVRWA(event){
        this.recordId = event.detail.id;
        console.log('recordId148 '+this.recordId);
         
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'New Record Has Been Created',
                    variant: 'success'
                })
            );
          //  this.SegrecordView = true;
            this.viewSegmentVendor = false;
            this.SegrecordVendView = true;
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




     //code start by abhimanyu


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
    label: 'BP Code',
 //   fieldName: 'Segment__c',
    type: 'String',
    sortable: true
},
];


@api segContId ;
@track error;
@track contList ;
@track vendList;
@track vendListN;
@track segmentIdforTDE;





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
     
// test code for modal
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
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList[key];
    this.SCList[key].Name = event.target.value;
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
}


handleEmailChange(event) {
    /*this.acc.AccountNumber = event.target.value;
    console.log("AccountNumber", this.acc.AccountNumber);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList[key];
    this.SCList[key].Email__c = event.target.value;
}

handlePhoneChange(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList[key];
    this.SCList[key].Phone__c = event.target.value;
    
}

handleDesignationChange(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList[key];
    this.SCList[key].Designation__c = event.target.value;
    this.SCList[key].Segment__c = this.segmentIdforSC;
    this.SCList[key].RecordTypeId = this.recordTypeSegC;
}
handleDesignationChangeCreateNew(event) {
    /*this.acc.Phone = event.target.value;
    console.log("Phone", this.acc.Phone);*/
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.SCList[key];
    this.SCList[key].Designation__c = event.target.value;
    this.SCList[key].Segment__c = this.segmentIdforSC;
    this.SCList[key].RecordTypeId = this.recordTypeSegC;
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




saveRecord(){  
    //console.log('582 record Id = '+this.segmentIdforSC);
         
    saveSegmentContacts({accList : this.SCList})
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

//save modal transaction details to segment
saveTDNR(){


}


// DYNAMIC ROW ADD AND REMOVE CODE ENDS PART2
handleTSNameChange(event) {
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.TSList[key];
    this.TSList[key].Name = event.target.value;
    //this.acc.Name = event.target.value;
    //console.log("name", this.acc.Name);
}

handleTSFTDChange(event) {
    var selectedRow = event.currentTarget;
    var key = selectedRow.dataset.id;
    var accountVar = this.TSList[key];
    this.TSList[key].FTD_Count__c = event.target.value;
    this.TSList[key].Segment__c = this.segmentIdforSC;
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
    //console.log('582 record Id = '+this.segmentIdforSC);
         console.log('tssList'+JSON.stringify(this.TSList));
    saveTransDetail({tssList : this.TSList})
        .then(result => {
            this.message = result;
            this.error = undefined;
            if(this.message !== undefined) {
                this.tcc.Name = '';
                this.tcc.Choose_Company__c = '';
                this.tcc.Choose_Newspaper__c = '';
                this.tcc.FTD_Count__c = '';
                this.tcc.Segment__c = '';
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




/*handleRowAction(event){
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch ( actionName ) {
            case 'view':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: row.Id,
                        actionName: 'view'
                    }
                });
                break;
            case 'edit':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: row.Id,
                        objectApiName: 'Segment_Contact__c',
                        actionName: 'edit'
                    }
                });
                break;
            default:
        }
       

    }
*/

//test code for modal

/*

@wire(getSegmentContacts,{ segmentIdforSegContacts: this.segContId })
segConts({
    error,
    data
}) {
    if (data) {
        this.contList = data;
        console.log('DATA = '+JSON.stringify(data));
    } else if (error) {
        this.error = error;
        console.log('ERROR ERROR ');
    }
}

*/

    //code end 

   

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
       this.isRWAComp = false;
       this.viewSegmentRecord=false; 
       this.createSegConContact = false;  
       this.createSegConVendor = false;
       this.searchValueRWA = '';
       this.segmentRecord = null;
    }

   /* showSegConContact(){
        this.createSegConContact= true;
        this.createSegConVendor = true;
    }
    */
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
    

    /*
    handleSubmitRWA(event){
        this.recordId = event.detail.id;
        this.segmentIdforSC = this.recordId.slice(0, -3);
       
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
            this.newRecordView = true;
            this.viewSegmentContact = true;
            this.viewSegmentVendor = true;
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
    */
    saveSegConVendor(event){
        this.recordId = this.segmentIdforTDE.slice(0, -3);
     //   this.recordId = event.detail.id.slice(0, -3);
     //   this.segmentIdforSC = this.recordId.slice(0, -3);
        console.log('recordId241 '+this.recordId);
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'Segment Contact Record Has Been Created',
                    variant: 'success'
                })
            );
         //  this.viewSegConVendor = true;
         // this.createSegConVendor = false;       
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
        console.log('>>> in rendered');
        if(!this.isRendered){
            this.getCurrentBrowserLocation();
        }
        //sets true once the location is fetched
        
        
    }
    checkOutFromOneApp(){
        console.log('>>> in checkOutFromOneApp');
        

            var options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            console.log('navigator.geolocation '+navigator.geolocation);
            console.log('this.selectedDeviceId--@@',this.selectedDeviceId);
            console.log('this.mobileId--@@',this.mobileId);
    
            this.mobileId = this.getCombinedDeviceId();
            console.log('Generated Device Native ID:', this.mobileId);
            
    
            var flag = false;
            console.log('India 2024--@@',this.mobileId);
            if(this.selectedDeviceId != null){
                
            if(this.selectedDeviceId == this.mobileId){
     
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
                    checkOutFromOneAppDepo({
                        lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.depoId,
                        recordTypeCheckin : this.recordTypeRWACheckin, userIds : this.loggedInUserId, mobId : this.mobileId, deviceNM :  this.deviceName
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
                                title: 'Depot Check-Out Successful!!',
                                variant: 'success'
                            })
                        );
                        }
                        else{
                            this.isRendered = false;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Depot Check-Out failed!!',
                                    message: 'Your current location is outside the allowable range.',
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
        else{
    
    
            erroLogCreate({
               recordId : this.depoId,
               userIds : this.loggedInUserId,
               mobId : this.mobileId,
            deviceNM :  this.deviceName
            })
            .then(result => {
                console.log('--this--',result);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Please check Out with register device!',
                        variant: 'errors'
                    })
                );
               
            });
    
           
        }
    }
    else{
        if(navigator.geolocation) {
            console.log('India 2023--@@',this.mobileId);
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
                checkOutFromOneAppDepo({
                    lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.depoId,
                    recordTypeCheckin : this.recordTypeRWACheckin, userIds : this.loggedInUserId, mobId : this.mobileId, deviceNM :  this.deviceName
                })
                .then(result => {
                    console.log('--this.Rahul--',this.mobileId);
                    this.checkInData = result;
                    console.log('--this.checkInData--',this.checkInData);
                    if(this.checkInData == 'Check Out Success'){
                        this.isCheckInOutShow = true;
                        this.isCheckInShow = false;
                        this.isRendered = true;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Depot Check-Out Successful!!',
                            variant: 'success'
                        })
                    );
                    }
                    else{
                        this.isRendered = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Depot Check-Out failed!!',
                                message: 'Your current location is outside the allowable range.',
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
    getCurrentBrowserLocation() {

        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        console.log('navigator.geolocation '+navigator.geolocation);
        console.log('this.selectedDeviceId--@@',this.selectedDeviceId);
        console.log('this.mobileId--@@',this.mobileId);

        this.mobileId = this.getCombinedDeviceId();
        console.log('Generated Device Native ID:', this.mobileId);
        

        var flag = false;
        console.log('India 2024--@@',this.mobileId);
        if(this.selectedDeviceId != null){
            
        if(this.selectedDeviceId == this.mobileId){
 
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
                    alert('Please select a different device.');
                }
                //this.isRendered = true;
                checkInFromOneApp({
                    lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.depoId,
                    recordTypeCheckin : this.recordTypeRWACheckin, userIds : this.loggedInUserId, mobId : this.mobileId, deviceNM :  this.deviceName
                })
                .then(result => {
                    console.log('--this.Rahul--',this.mobileId);
                    this.checkInData = result;
                    console.log('--this.checkInData--',this.checkInData);
                    if(this.checkInData == 'Check In Success'){
                        this.isCheckInOutShow = true;
                        this.isCheckInShow = false;
                        this.isRendered = true;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Depot Check-in Successful!!',
                            variant: 'success'
                        })
                    );
                    }
                    else{
                        this.isRendered = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Depot Check-in failed!!',
                                message: 'Your current location is outside the allowable range.',
                                variant: 'error'
                            })
                        );
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
    else{


        erroLogCreate({
           recordId : this.depoId,
           userIds : this.loggedInUserId,
           mobId : this.mobileId,
        deviceNM :  this.deviceName
        })
        .then(result => {
            console.log('--this--',result);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please check in with register device!',
                    variant: 'errors'
                })
            );
           
        });

       
    }
}
else{
    if(navigator.geolocation) {
        console.log('India 2023--@@',this.mobileId);
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
            checkInFromOneApp({
                lat: position.coords.latitude, lng: position.coords.longitude, recordId : this.depoId,
                recordTypeCheckin : this.recordTypeRWACheckin, userIds : this.loggedInUserId, mobId : this.mobileId, deviceNM :  this.deviceName
            })
            .then(result => {
                console.log('--this.Rahul-1234-',this.mobileId);
                this.checkInData = result;
                console.log('--this.checkInData--',this.checkInData);
                if(this.checkInData == 'Check In Success'){
                    this.isCheckInOutShow = true;
                    this.isCheckInShow = false;
                    this.isRendered = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Depot Check-in Successful!!',
                        variant: 'success'
                    })
                );
                }
                else{
                    this.isRendered = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Depot Check-in failed!!',
                            message: 'Your current location is outside the allowable range.',
                            variant: 'error'
                        })
                    );
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

//Rahul Indora Today

getCombinedDeviceId() {


     let deviceId = localStorage.getItem('deviceId');
     console.log('==localStorage deviceId=2119=',deviceId);
    if (!deviceId) {
        deviceId = this.generateDeviceId();
         console.log('==deviceId deviceId==',deviceId);
        localStorage.setItem('deviceId', deviceId);
    }
    console.log('==Rahul deviceId=2111=',deviceId);
    return deviceId;

}

getOrCreateDeviceId() {
   
    
    const deviceData = {
        deviceId: this.getOrCreateDeviceId(),
        fingerprint: {
            browser: navigator.userAgent,
            platform: navigator.platform,
            screen: screen.width + "x" + screen.height,
            language: navigator.language
        }
    };
     console.log('==deviceData deviceId=2128=',deviceData); 
    return JSON.stringify(deviceData);
}



generateDeviceId() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const vendor = navigator.vendor;
    const deviceString = userAgent + platform + vendor;
   console.log('==platform==',platform);
   console.log('==userAgent==',userAgent);
   console.log('==vendor==',vendor);
    let hash = 0;
    for (let i = 0; i < deviceString.length; i++) {
        const char = deviceString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return  hash.toString();
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
             // Display fresh data in the datatable
             //return refreshApex(this.transactionData);
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
      
        viewTransactionDetailsSecondTime({
          //  recordId : this.segmentId.slice(0,-3)  
          recordId : this.segmentId  
        })
        .then(result => {
            console.log('Trans Result '+ JSON.stringify(result));
            this.viewTransactionData = result.dataTable;
            this.lastDate = result.dataHeader.lastVisit;
            console.log('last Date '+ this.lastDate);
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
        console.log('>>> in rendered callback');
        if(!this.isRendered){
            this.getCurrentBrowserLocationOn();
        }
        //sets true once the location is fetched
        
        
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
                    if(result=='success'){
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Location Detected',
                                message: 'Checked In successfully.',
                                variant: 'success'
                            })
                        );
                        this.isRendered = true;
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


    //For OOH Button Start Here
    searchKeywordOOH(event) {
        this.searchValueOOH = event.target.value;
        if (this.searchValueOOH !== '') {
            displaySegmentsOOH({
                    searchkey: this.searchValueOOH
                })
                .then(result => {
                    // set @track contacts variable with return contact list from server  
                   console.log('result52'+JSON.stringify(result));
                   console.log('result.length'+result.length);
                /*    var tempSegList = [];  
                    for (var i = 0; i < result.length; i++) {  
                     let tempRecord = Object.assign({}, result[i]); //cloning object  
                     tempRecord.recordLink = "/" + tempRecord.Id;  
                     tempSegList.push(tempRecord);  
                    }
                    this.segmentRecord = tempSegList;*/
                    this.segmentRecord = result;    
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

    handleClickOoh(){
        this.isRWA = false;
        this.isOOHComp=true;
        this.isDEPO=false;
        this.isCSP=false;    
    }

    onBackClickOOH(){
        this.isRWA = true;
        this.isOOHComp=false;
        this.isDEPO=true;
        this.isCSP=true;   
        this.segmentRecord = null; 
        this.searchValueOOH = '';
    }

    navigateToNewOOH(){
        recordTypeOOH()
        .then(result => {
            this.recordTypeOOH = result;
        })
        .catch(error => {
              
        });
        this.newOOHRecord=true;
        this.isOOHComp=false;

    }

    onBackCreateNewOOH(){
        this.isOOHComp = true;
        this.newOOHRecord=false;
    }

    handleSubmitOOH(event){
        this.recordId = event.detail.id;
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'New Record Has Been Created',
                    variant: 'success'
                })
            );
            this.newOOHRecordView = true;
            this.newOOHRecord=false;       
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

    onBackCreateViewOOH(){
        this.newOOHRecordView = false;
        this.newOOHRecord = true;
    }

    /*handleClickOOHLink(event){
        this.viewSegmentRecordOOH = true;
        this.isOOHComp = false;
        this.segmentId = event.target.getAttribute("data-id");
        console.log('Event172'+this.segmentId);
    }*/
    handleClickOOHLink(event){
        this.viewSegmentRecord = true;
        this.viewDEPO = false;
        this.isOOHComp = false;
        this.segContId = event.target.getAttribute("data-id");
        this.segmentId = event.target.getAttribute("data-id");
        this.segmentIdforSC = this.segmentId;
    this.segmentIdforTDE = this.segmentId.slice(0,-3);
        
        console.log('Event record Id 822 = '+this.segmentIdforSC); 
        console.log('Event record Id 823 = '+this.segmentIdforTDE); 
    
    
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
               this.viewTsnDetailrecords();
    
           }


    onBackSegmentViewOOH(){
        this.isOOHComp = true;
        this.viewSegmentRecordOOH=false;    
    }

    //For CSP Button Start Here
    
    searchKeywordCSP(event) {
        this.searchValueCSP = event.target.value;
        if (this.searchValueCSP !== '') {
            displaySegmentsCSP({
                    searchkey: this.searchValueCSP
                })
                .then(result => {
                    // set @track contacts variable with return contact list from server  
                   console.log('result52'+JSON.stringify(result));
                   console.log('result.length'+result.length);
                /*    var tempSegList = [];  
                    for (var i = 0; i < result.length; i++) {  
                     let tempRecord = Object.assign({}, result[i]); //cloning object  
                     tempRecord.recordLink = "/" + tempRecord.Id;  
                     tempSegList.push(tempRecord);  
                    }
                    this.segmentRecord = tempSegList;*/
                    this.segmentRecord = result;    
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
    

    handleClickCsp(){
        this.isRWA = false;
        this.isOOH=false;
        this.isCSPComp=true;
        this.isDEPO=false;    
    }

    onBackClickCSP(){
        this.isRWA = true;
        this.isOOH=true;
        this.isCSPComp=false; 
        this.isDEPO=true;
        this.segmentRecord = null;   
        this.searchValueCSP = '';
        
    }

    navigateToNewCSP(){
        recordTypeCSP()
        .then(result => {
            this.recordType = result;
        })
        .catch(error => {
              
        });
        this.newCSPRecord=true;
        this.isCSPComp=false;
    }

    onBackCreateNewCSP(){
        this.isCSPComp = true;
        this.newCSPRecord=false;
    }

    handleSubmitCSP(event){
        this.recordId = event.detail.id;
        if(this.recordId !== null){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'success',
                    message: 'New Record Has Been Created',
                    variant: 'success'
                })
            );
            this.newCSPRecordView = true;
            this.newCSPRecord=false;       
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

    onBackCreateViewCSP(){
        this.newCSPRecordView = false;
        this.newCSPRecord = true;
    }

    handleClickCSPLink(event){
        this.viewSegmentRecordCSP = true;
        this.isCSPComp = false;
        this.segmentId = event.target.getAttribute("data-id");
        console.log('Event172'+this.segmentId);
    }

    onBackSegmentViewCSP(){
        this.isCSPComp = true;
        this.viewSegmentRecordCSP=false;    
    }

    //For DEPO Button Start Here
//      {
//           searchkey: this.searchValueCSP
//      }

    handleClickDepo(){
        
        displaySegmentsDEPO({ 
            Id: '0057F000004GzygQAC' //pass id of the user  USER_ID, for testing use - 0057F000004GzygQAC
            
        })
        
        .then(result => {  
            console.log('USER_ID depo = '+USER_ID);
           console.log('result52'+JSON.stringify(result));
            this.depoSegmentRecord = result;    
        })
    
        this.viewDEPO = true;
        this.isDEPO=true;
        this.isOOH=false;
        this.isCSP=false;
        this.isRWA=false;
       
    }
    onBackClickDEPO(){
        this.isOOH=true;
        this.isDEPO=true;
        this.isCSP=true;
        this.isRWA=true;
        this.viewDEPO = false;
        this.viewDEPO = '';
        this.searchValueRWA = '';
        this.searchValueCSP = '';
        this.searchValueOOH = '';
        this.segmentRecord = '';
    }
    handleClickLinkDEPO(event){
        

        

        this.viewSegmentRecordDEPO = true;
       // this.segmentId = event.target.getAttribute("data-id");
          this.depoId = event.target.getAttribute("data-id");
         var depolist = this.depoSegmentRecord;
         console.log('--depolist--@@--', JSON.stringify(depolist));
         var deviceId;
         for(let i=0; i< depolist.length; i++){
            if(depolist[i].RMD_User__r.Mobile_Id__c != 'undefined'){
                deviceId = depolist[i].RMD_User__r.Mobile_Id__c;
            }
         }
         
        validateDepoCheckInStatus({ 
            recordIdDepo : this.depoId
        })
        
        .then(result => {  
           console.log('recordIdDepo = '+this.depoId);
           console.log('result Depo Status'+JSON.stringify(result));
           if(result === true){
            this.isCheckInOutShow = false;
            this.isCheckInShow = true; 
            console.log('isCheckInOutShow = '+ this.isCheckInOutShow);
           }
           else{
            this.isCheckInOutShow = true;
            this.isCheckInShow = false;   
            console.log(' this.isCheckInShow = '+ this.isCheckInShow);
           }
            
        })
        console.log('--deviceId--@@--'+deviceId);
        this.selectedDeviceId = deviceId;
        console.log('Event172'+this.depoId);
        this.viewDEPO = false;
        this.viewSegmentRecord = false;
    }
    onBackSegmentViewDEPO(){
        this.isOOH=true;
        this.isDEPO=true;
        this.isCSP=true;
        this.isRWA=true;
        this.viewSegmentRecordDEPO = false;
        this.viewDEPO = true;
    }
}