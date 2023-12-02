import React from 'react';
import { makeStyles } from '@mui/styles';



const useStyles = makeStyles(() => ({
    container: {
        position:"fixed",
        padding:"0",
        margin:"0",
        top:"0",
        left:"0",
        backgroundColor: "#1B263B",
        width: "100%",
        height: "100%",

    },

}));

const List_PR = () =>{
    const classes = useStyles();
    return(
        <div className={classes.container}>
hello bitches

        </div>

    );

}

export default List_PR;
