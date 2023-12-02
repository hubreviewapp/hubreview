import React from 'react';
import { makeStyles } from '@mui/styles';


const useStyles = makeStyles(() => ({
    root: {
        position:"absolute",
        padding:"0",
        margin:"0",
        top:"0",
        left:"0",
        backgroundColor: "#1B263B",
        width: "100%",
        height: "100%",

    },

    container :{
        padding :"20px",
        display: "flex",
        flexDirection: "column"
    },
    PR_box:{
        borderStyle: "solid",
        borderColor:"#BCBCBC",
        borderRadius:"10px",
        borderWidth:"0.5px",
        margin:"5px",
        padding:"5px",

    }

}));

const List_PR = () =>{
    const classes = useStyles();
    const prs = ["pr1", "pr2", "pr3"];
    return(
        <div className={classes.root}>
            <div className={classes.container}>
                {
                    prs.map(itm =>
                        <div className={classes.PR_box}>
                            {itm}
                        </div>
                    )
                }



            </div>

        </div>

    );

}

export default List_PR;
