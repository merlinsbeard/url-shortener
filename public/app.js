const useInput = (initialValue) => {
  const [value, setValue] = React.useState(initialValue);
  return {
    value,
    setValue,
    reset: () => setValue(""),
    bind: {
      value,
      onChange: (event) => {
        setValue(event.target.value);
      },
    },
  };
};

function FormSuccess(props) {
  return (
    <>
      <a href={`${window.location.protocol}//${props.url}`}>
        View link here: {`${window.location.protocol}//${props.url}`}
      </a>
    </>
  );
}

function FormFail(props) {
  return <div className="has-text-danger">{props.message}</div>;
}

function UrlForm(props) {
  const { value: longUrl, bind: bindLongUrl, reset: resetLongUrl } = useInput(
    ""
  );
  const {
    value: shortUrl,
    bind: bindShortUrl,
    reset: resetShortUrl,
  } = useInput("");
  const [status, setStatus] = React.useState("NO_ACTION");
  const [errorMessage, setErrorMessage] = React.useState();
  const [orange, setOrange] = React.useState();

  const handleSubmit = (event) => {
    event.preventDefault();
    postUrl();
  };

  const resetForm = () => {
    resetLongUrl();
    resetShortUrl();
  };

  const postUrl = async () => {
    setStatus(() => "PENDING");
    const res = await fetch("/short", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        longUrl: longUrl,
        shortUrl: shortUrl,
      }),
    });
    if (res.status === 200) {
      const result = await res.json();
      setOrange(() => result.shortUrl);
      setStatus("SUCCESS");
      resetForm();
    } else {
      const result = await res.json();
      setStatus(() => "FAIL");
      setErrorMessage(() => result.message);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="has-addons has-addons-centered">
        <div class="field">
          <label class="label">Url*</label>
          <div class="control">
            <input
              class="input"
              type="url"
              placeholder="https://benpaat.xyz"
              name="url"
              {...bindLongUrl}
              required
            />
            <p class="help">This field is required</p>
          </div>
        </div>

        <div class="field">
          <label class="label">Short URL</label>
          <div class="control">
            <input
              class="input"
              type="text"
              placeholder="12345"
              name="url"
              {...bindShortUrl}
            />
          </div>
        </div>

        <div class="field">
          <div class="control">
            <button type="submit" value="submit" class="button is-primary">
              Submit
            </button>
          </div>
        </div>
        <div className="has-text-centered">
          {status === "SUCCESS" ? (
            <FormSuccess url={`${window.location.host}/${orange}`} />
          ) : null}
          {status === "FAIL" ? <FormFail message={errorMessage} /> : null}
        </div>
      </form>
    </div>
  );
}

function App() {
  return (
    <section class="section">
      <UrlForm />
    </section>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
