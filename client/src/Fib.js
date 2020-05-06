import React,{Component} from 'react';
import axios from 'axios';

class Fib extends Component {
    state = {
        seenIndexes:[],
        values: {},
        index: ''
    };

    componentDidMount(){
        this.fetchValues();
        this.fetchIndexes();
    }

    async fetchValues(){
        const values = await axios.get('/api/values/current');
        console.log(values);
        this.setState({values: values.data});
    }

    async fetchIndexes(){
        console.log("Calling api/values/all");
        const seenIndexes = await axios.get('/api/values/all');
        console.log("index visited");
        console.log("seenIndexes"+ seenIndexes.data);
        console.log(Array.from(seenIndexes.data)[0]['number']);
        this.setState({seenIndexes: Array.from(seenIndexes.data)});
    }

    renderSeenIndexes(){

        // console.log(typeof this.state.seenIndexes);
        let numbers = "";
        for(let num of this.state.seenIndexes){
            numbers += num['number'] + "   ";
        }

        return numbers;

        // return this.state.seenIndexes.map(({index}) => index).join(', ');
    }

    renderValues(){

        const enteries = [];

        for(let key in this.state.values){
            enteries.push(
                <div key={key}>
                    For index {key} I calculated {this.state.values[key]}
                </div>
            )
        }

        return enteries;
    }

    handleSubmit = async (event) =>{
        event.preventDefault();

        const res = await axios.post('/api/values',{
            index : this.state.index
        });

        if(res.data["working"]){
            this.fetchValues();
            this.fetchIndexes();
        }

        console.log(res);

        this.setState({index:''});
    }

    render(){
        return (
            <>
                <div>
                    <form onSubmit={this.handleSubmit}>
                        <label>Enter your index :</label>
                        <input value={this.state.index}
                               onChange={event => this.setState({index: event.target.value})}/>
                        <button>Submit</button>
                    </form>
                </div>

                <div>
                    <h3>Indexes I have seen:</h3>
                    {this.renderSeenIndexes()}

                    <h3>Calculated Values :</h3>
                    {this.renderValues()}
                </div>
            </>
            
        )
    }
}


export default Fib;