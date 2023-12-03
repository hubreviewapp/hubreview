import React from "react";
import { makeStyles } from "@mui/styles";
import TabComponent from "../components/TabComponent";
import prsData from "../pr_data.json";
import { Button, Container, Grid } from "@mui/material";
import github_logo from "../icons/github-logo.png";
import user_logo from "../icons/user.png";
import "../styles/common.css";
import LabelButton from "../components/LabelButton";
import { Link } from "react-router-dom";

const useStyles = makeStyles(() => ({
  root: {
    // position:"absolute",
    height: "700px",
    padding: "0",
    margin: "0",
    top: "0",
    left: "0",
    backgroundColor: "#1B263B",
    width: "100%",
  },

  container: {
    padding: "20px",
    margin: "auto",
  },
  PR_box: {
    margin: "auto",
    padding: "5px",
    display: "flex",
    flexDirection: "column",
    width: "90%",
  },
  PR_box_item: {
    margin: "auto",
    marginTop: "20px",
    padding: "15px",
    borderStyle: "solid",
    borderColor: "#BCBCBC",
    borderRadius: "10px",
    borderWidth: "0.5px",
    height: "60px",
    width: "90%",
    display: "flex",
    "&:hover": {
      borderColor: "rgba(188,188,188,0.69)",
      cursor: "pointer",
    },
  },

  icon: {
    width: "30px",
    height: "30px",
    marginLeft: "10px",
    borderRadius: "20px",
  },

  gridItem: {
    display: "flex",

    //justifyContent:"space-around",
  },
}));

const PRList = () => {
  const classes = useStyles();
  const pr_tabs: string[] = ["created", "assigned", "merged"];
  return (
    <div className={classes.root}>
      <Container className={classes.container}>
        <div className={classes.PR_box}>
          {prsData.map((itm) => (
            <Grid container className={classes.PR_box_item}>
              <Grid className={classes.gridItem} item xs={7}>
                {itm.id}
                <img src={user_logo} className={classes.icon} alt={"logo"} />

                <div className={"bold"}>{itm.prName}</div>

                <div className={"light"}>at {}</div>
                {itm.repository}
                <div className={"light"}>created :{itm.dateCreated}</div>
              </Grid>
              <Grid item xs={4} className={classes.gridItem}>
                {itm.labels.map((lbl) => (
                  <LabelButton label={lbl} height={30} width={120} />
                ))}
              </Grid>
              <Grid item xs={1}>
                <img className={classes.icon} src={github_logo} alt={"icon"} />
              </Grid>
            </Grid>
          ))}
        </div>
      </Container>
      <Link to={"/createPR"}>
        <Button variant="contained">Create New PR</Button>
      </Link>
    </div>
  );
};

export default PRList;
