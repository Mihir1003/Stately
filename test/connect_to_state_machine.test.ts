import { SFNClient,CreateStateMachineCommand,StartExecutionCommand,DeleteStateMachineCommand} from "@aws-sdk/client-sfn";

// write test case to make sure aws state machine can be connected to locally

test("connect to state machine", async () => {
  const client = new SFNClient({ region: "us-east-1", endpoint: "http://localhost:8083" });
  try {
  let data = await client.send(new CreateStateMachineCommand({
    name: "test",
    definition: "{\
      \"Comment\": \"A Hello World example of the Amazon States Language using a Pass state\",\
      \"StartAt\": \"HelloWorld\",\
      \"States\": {\
        \"HelloWorld\": {\
          \"Type\": \"Pass\",\
          \"End\": true\
        }\
      }}",
    roleArn: "arn:aws:iam::012345678901:role/DummyRole"
  })) 
  expect(data).toBeDefined();
  await client.send(new StartExecutionCommand({
    stateMachineArn: "arn:aws:states:us-east-1:123456789012:stateMachine:test",
    input: "{}"
  }))
  }
  catch (err) {
    expect(err).toBeUndefined();
  }

}
);

// delete state machine after test
afterAll(() => {
  const client = new SFNClient({ region: "us-east-1", endpoint: "http://localhost:8083" });
  client.send(new DeleteStateMachineCommand({
    stateMachineArn: "arn:aws:states:us-east-1:123456789012:stateMachine:test"
  }))
  // fail test if error
  .catch((err) => {
    expect(err).toBeUndefined();
  }
  )
  // pass test if no error
  .then((data) => {
    expect(data).toBeDefined();
  }
  )
})