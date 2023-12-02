import React from 'react';
import { makeStyles } from '@mui/styles';
import TabComponent from "../components/tab";
import prsData from '../pr_data.json';
import {Container, Grid} from '@mui/material';
import github_logo from "../icons/github-logo.png";
import "../styles/common.css";
import LabelButton from "../components/LabelButton";


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
        width:"90%",


    },
    PR_box_item:{
        margin:"auto",
        marginTop:"20px",
        padding:"15px",
        borderStyle: "solid",
        borderColor:"#BCBCBC",
        borderRadius:"10px",
        borderWidth:"0.5px",
        height:"60px",
        width:"90%",
        display:"flex",
        '&:hover': {
            borderColor:"rgba(188,188,188,0.69)" ,
            cursor:"pointer",
        },


    },

    icon:{
        width:"30px",
        height:"30px",
    },

    gridItem:{
        display:"flex",

    }


}));


const List_PR = () =>{
    const classes = useStyles();
    const pr_tabs: string[]  = ["created", "assigned", "merged"];
    return(
        <div className={classes.root}>
            <Container className={classes.container}>
                <div className={classes.PR_box}>
                    {
                        prsData.map(itm =>
                            <Grid  container className={classes.PR_box_item} >
                                <Grid  className={classes.gridItem} item xs={6}>
                                    {
                                        itm.id
                                    }

                                    <div className={"bold"}>
                                        {itm.prName}
                                    </div>

                                    <div className={"light"}>
                                        at { }
                                        {itm.repository}
                                    </div>

                                    <div className={"light"}>
                                        created :
                                         { itm.dateCreated}
                                    </div>
                                </Grid>
                                <Grid item xs={5} className={classes.gridItem}>
                                    {
                                        itm.labels.map(lbl =>
                                            <LabelButton label={lbl}/>
                                        )
                                    }

                                </Grid>
                                <Grid item xs={1} >
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
