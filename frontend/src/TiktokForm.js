import React, { useState } from "react";
import "./TiktokForm.scss";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";

function TiktokForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function downloadVideos(user) {
    const $title = document.querySelector(`#videoName`);
    const title = $title.value.trim();

    const $urls = document.querySelector(`#tiktokURLs`);
    const urls = $urls.value.split("\n").filter((e) => e !== "");

    return new Promise(async (resolve, reject) => {
      const URL = `http://localhost:5000`;
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
        console.log(data.error);

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
            setLoading(true);
            const res = await downloadVideos();
            setLoading(false);
            setSuccess(res.folder);
            console.log("res", res);
          } catch (err) {
            console.log("erro", err);
          }
        }}>
        <Row>
          <Col>
            <Form.Floating className="TiktokForm-input">
              <Form.Control id="videoName" placeholder="Video name" />
              <label htmlFor="videoName">Video name</label>
            </Form.Floating>
            <Form.Floating className="TiktokForm-input TiktokForm-textarea">
              <Form.Control
                id="tiktokURLs"
                as="textarea"
                placeholder="Enter the video URLs (one per line)"
                style={{ height: "100px" }}
              />
              <label htmlFor="tiktokURLs">
                Enter the video URLs (one per line)
              </label>
            </Form.Floating>
          </Col>
        </Row>
        <Button disabled={loading} type="submit">
          {loading ? "Loading..." : "Send"}
        </Button>

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
