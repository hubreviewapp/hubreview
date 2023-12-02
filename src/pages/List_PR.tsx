import React from 'react';
import { makeStyles } from '@mui/styles';
import TabComponent from "../components/tab";
import prsData from '../pr_data.json';
import {Container, Grid} from '@mui/material';
import github_logo from "../icons/github-logo.png"


const useStyles = makeStyles(() => ({
    root: {
       // position:"absolute",
        height: "700px",
        padding:"0",
        margin:"0",
        top:"0",
        left:"0",
        backgroundColor: "#1B263B",
        width: "100%",


    },

    container :{
        padding :"20px",
        margin:"auto",
    },
    PR_box:{

        margin:"auto",
        padding:"5px",
        display:"flex",
        flexDirection: "column",
        width:"80%",


    },
    PR_box_item:{
        margin:"5px",
        padding:"15px",
        borderStyle: "solid",
        borderColor:"#BCBCBC",
        borderRadius:"10px",
        borderWidth:"0.5px",
        height:"60px",
        width:"80%",
        display:"flex",


    },

    icon:{
        width:"30px",
        height:"30px",
    }

}));

const List_PR = () =>{
    const classes = useStyles();
    const pr_tabs: string[] = ["created", "assigned", "merged"];
    return(
        <div className={classes.root}>
            <Container className={classes.container}>
                <div className={classes.PR_box}>
                    {
                        prsData.map(itm =>
                            <Grid  container className={classes.PR_box_item} >
                                <Grid item xs={1}>
                                    {itm.id}
                                </Grid>
                                <Grid item xs={2}>
                                    {itm.prName}
                                </Grid>
                                <Grid item xs={2}>
                                    {itm.repository}
                                </Grid>
                                <Grid item xs={2}>
                                    {itm.author}
                                </Grid>
                                <Grid item xs={2}>
                                    <img className={classes.icon} src={github_logo}/>
                                </Grid>
                            </Grid>
                        )
                    }
                </div>


            </Container>

        </div>

    );

}

export default List_PR;
