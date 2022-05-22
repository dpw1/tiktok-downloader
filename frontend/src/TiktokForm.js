import React, { useState } from "react";
import "./TiktokForm.scss";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";

import { useStatePersist as useStickyState } from "use-state-persist";

function TiktokForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState("");

  const [folderName, setFolderName] = useStickyState("@folderName", "");
  const [videoURLs, setVideoURLs] = useStickyState("@videoURLs", "");

  function resetStates() {
    setSuccess("");
    setLoading(false);
    setError(false);
  }

  function handleDisableButton() {
    if (loading) {
      return true;
    }

    if (!folderName || folderName.trim() === "") {
      return true;
    }

    return false;
  }

  async function getTotalTime() {
    const $urls = document.querySelector(`#tiktokURLs`);
    const urls = $urls.value.split("\n").filter((e) => e !== "");

    return new Promise(async (resolve, reject) => {
      const URL = `http://localhost:5000/totaltime`;
      const settings = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videos: urls }),
      };

      const fetchResponse = await fetch(URL, settings);
      const data = await fetchResponse.json();
      if (data.hasOwnProperty("error")) {
        console.log("total time", fetchResponse);

        setError(data.error);
        reject();
      }
      resolve(data);
    });
  }

  async function downloadVideos() {
    const $title = document.querySelector(`#folderName`);
    const title = $title.value.trim();

    const $urls = document.querySelector(`#tiktokURLs`);
    const urls = $urls.value.split("\n").filter((e) => e !== "");

    console.log(urls);

    return new Promise(async (resolve, reject) => {
      const URL = `http://localhost:5000/download`;
      const settings = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, videos: urls }),
      };

      const fetchResponse = await fetch(URL, settings);
      const data = await fetchResponse.json();
      if (data.hasOwnProperty("error")) {
        console.log(fetchResponse);

        setError(data.error);
        reject();
      }
      resolve(data);
    });
  }
  return (
    <div className="TiktokForm">
      <Form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            resetStates();
            setLoading(true);
            const res = await downloadVideos();
            setLoading(false);
            setSuccess(res.folder);
            console.log("res", res);
          } catch (err) {
            setLoading(false);

            if (err !== undefined && err.length >= 1) {
              setError(err);
            }
          }
        }}>
        <Row>
          <Col>
            <Form.Floating className="TiktokForm-input">
              <Form.Control
                id="folderName"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                }}
              />
              <label htmlFor="folderName">Folder name</label>
            </Form.Floating>
            <Form.Floating className="TiktokForm-input TiktokForm-textarea">
              <Form.Control
                id="tiktokURLs"
                as="textarea"
                value={videoURLs}
                onChange={(e) => setVideoURLs(e.target.value)}
                placeholder="Enter the video URLs (one per line)"
                style={{ height: "100px" }}
              />
              <label htmlFor="tiktokURLs">
                Enter the video URLs (one per line)
              </label>
            </Form.Floating>
          </Col>
        </Row>

        {/* <Form.Check
          type="switch"
          id="custom-switch"
          label="Make video compilation (not working)"
        /> */}

        <div className="TiktokForm-info">
          {length && length.length >= 1 && (
            <p>
              Videos compilation time: <b>{length}</b>
            </p>
          )}
        </div>
        <div className="TiktokForm-buttons">
          <Button disabled={handleDisableButton()} type="submit">
            {loading ? "Loading..." : "Download"}
          </Button>

          <Button
            onClick={async (e) => {
              e.preventDefault();

              const total = await getTotalTime();

              setLength(total.length);
            }}
            disabled={handleDisableButton()}
            type="submit">
            Get total time
          </Button>
        </div>

        {/* Error alert */}
        <Alert
          className="TiktokForm-alert"
          variant="danger"
          show={error && error.length >= 1}>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>

        {/*  Success alert */}
        <Alert
          className="TiktokForm-alert"
          variant="success"
          show={success && success.length >= 1}>
          <Alert.Heading>Success</Alert.Heading>
          <p>{success}</p>
        </Alert>

        {/* {error && error.length >= 1 && } */}
      </Form>
    </div>
  );
}

export default TiktokForm;
