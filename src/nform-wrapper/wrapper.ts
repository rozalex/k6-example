import {wcfclient, priority} from '../priority-proto-api/index';
import {properties} from './consts';
import 'regenerator-runtime';

export class Form {
    session: string = "";
    name: string;
    columns: any;
    actions: any;
    subforms: any;
    index: number

    constructor(name: string, index: number) {
        wcfclient.setBaseUrl("https://dev.eshbel.com/wcf/wcf/Service.svc");
        this.name = name;
        this.index = index;
    }


    async start() {
        const form = await wcfclient.start(
            new priority.netitems.form.StartRq({
                Fname: this.name,
                Properties: properties
            })
        )

        this.session = form.Session;
        this.columns = await wcfclient.columns(
            new priority.netitems.form.ColumnsRq({
                Session: this.session,
                Properties: properties
            })
        );
    
        this.subforms = await wcfclient.subforms(
            new priority.netitems.form.SubformsRq({
                Session: this.session,
                Properties: properties
            })
        );
    
        this.actions = await wcfclient.actions(
            new priority.netitems.form.ActionRq({
                Session: this.session,
                Properties: properties
            })
        );

        console.log("Form Started. Sessuin", this.session);
    }

    async fetch(column: number, value: string) {
        const filters: priority.netitems.form.IFilter[] = [
            {
                Condition: [
                    {
                        ColumnID: column,
                        Operator: priority.netitems.shared.ComparisonOperator.Eq,
                        Values: [value]
                    }
                ]
            }
        ];
    
        const res = await wcfclient.recordsFetch(
            new priority.netitems.form.FetchRq({
                Session: this.session,
                Properties: properties,
                Filters: filters,
            })
        );
    
    }
}
  

