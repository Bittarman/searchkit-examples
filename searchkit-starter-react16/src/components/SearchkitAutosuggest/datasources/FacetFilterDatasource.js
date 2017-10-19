import { FacetAccessor } from "searchkit"
import Utils from "../../../Utils"

const map = require("lodash/map")

export class FacetFilterDatasource {

    constructor(options){
        this.options = options
    }

    isSearchkitSource(){
        return true
    }

    configure(searchkit){
        this.searchkit = searchkit
        if(this.options.accessorId){
            let accessor = searchkit.accessors.statefulAccessors[this.options.accessorId]
            if(!accessor){
                console.error(`Could not create facet filter datasource with accessorId=${this.options.accessorId}`)
            } else {
                this.originalAccessor = accessor
            }
        } else {
            let {id, field, operator, fieldOptions, title} = this.options
            this.originalAccessor = new FacetAccessor(id, {
                id, field, operator, fieldOptions, title                
            })
            this.searchkit.addAccessor(this.originalAccessor)            
        }
        this.delegateAccessor = this.createDelegate(this.originalAccessor)

    }

    createDelegate(accessor){
        let delegateAccessor = new FacetAccessor(accessor.options.id, { ...accessor.options })
        delegateAccessor.uuid = accessor.options.id
        return delegateAccessor
    }

    search(query, queryString){
        this.delegateAccessor.options.include = Utils.createRegexQuery(queryString)
        this.delegateAccessor.size = 3
        return this.delegateAccessor.buildOwnQuery(query)
    }

    onSelect = (key)=> {
        this.originalAccessor.state = this.originalAccessor.state.toggle(key)
        this.searchkit.performSearch()
        return ""
    }

    getGroupedResult(results){
        this.delegateAccessor.setResults(results)
        let items = map(this.delegateAccessor.getBuckets(), (item)=> {
            item.select = ()=> {
                return this.onSelect(item.key)
            }
        })
        return {
            id: this.delegateAccessor.options.id,
            title: this.delegateAccessor.options.title,
            results: this.delegateAccessor.getBuckets(),
            onSelect: this.onSelect
        }
    }
     
}