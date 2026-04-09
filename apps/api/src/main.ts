import "reflect-metadata";
import express from "express";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3100);

  app.use(
    express.text({
      type: ["text/xml", "application/xml"]
    })
  );
  app.enableCors();
  await app.listen(port);
}

void bootstrap();
