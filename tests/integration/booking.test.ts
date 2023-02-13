import { cleanDb, generateValidToken } from "../helpers";
import app, { init } from "@/app";
import supertest from "supertest";
import httpStatus from "http-status";
import faker from "@faker-js/faker";
import { createBooking, createEnrollmentWithAddress, createHotel, createPayment, createRoomWithHotelId, createTicket, createTicketTypeWithHotel, createUser } from "../factories";
import * as jwt from "jsonwebtoken";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/booking");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({userId: userWithoutSession.id}, process.env.JWT_SECRET);
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it("should respond with status 200 when the user has a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);

            const booking = await createBooking({
                userId: user.id,
                roomId: room.id
            });

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual({
                id: booking.id,
                Room: {
                    id: expect.any(Number),
                    name: expect.any(String),
                    capacity: expect.any(Number),
                    hotelId: expect.any(Number),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String)
                }
            })
        });
        it("should respond with status 404 when the user does not have a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });
    });

    function createValidBody() {
        return {
            "roomId": 1
        }
    }
    
    describe("POST /booking", () => {
        it("should respond with status 401 if no token is given", async () => {
            const validPostBody = createValidBody();
            const response = await server.post("/booking").send(validPostBody);
            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
    
        it("should respond with status 401 if given token is not valid", async () => {
            const token = faker.lorem.word();
            const validPostBody = createValidBody();
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(validPostBody);
    
            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
    
        it("should respond with status 401 if there is no session for given token", async () => {
            const userWithoutSession = await createUser();
            const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
            const validPostBody = createValidBody();
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(validPostBody);
    
            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
        describe("when token is valid", () => {
            it("should respond with status 200 with a valid body", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
                const validPostBody = createValidBody();
    
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
    
                expect(response.status).toEqual(httpStatus.OK);
            });
            it("should respond with status 400 with a invalid body", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
                const validPostBody = createValidBody();
    
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
    
                expect(response.status).toEqual(httpStatus.BAD_REQUEST);
            });
            it("should respond with status 404 with an invalid body and there is no roomId", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id + 1 });
    
                expect(response.status).toEqual(httpStatus.NOT_FOUND);
            });
            it("should respond with status 403 with an invalid body and that there are no vacancies", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                await createBooking({
                    userId: user.id,
                    roomId: room.id
                })
                await createBooking({
                    userId: user.id,
                    roomId: room.id
                })
                await createBooking({
                    userId: user.id,
                    roomId: room.id
                })
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
    
                expect(response.status).toEqual(httpStatus.FORBIDDEN);
            });
            it("should respond with status 403 when the user does not have a enrollment", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const ticketType = await createTicketTypeWithHotel();
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
    
                expect(response.status).toEqual(httpStatus.FORBIDDEN);
            });
            it("should respond with status 403 when the user does not have a paymented ticket", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
    
                expect(response.status).toEqual(httpStatus.FORBIDDEN);
            });
        });
    });

    describe("PUT /booking", () => {
        it("should respond with status 401 if no token is given", async () => {
            const validPostBody = createValidBody();
            const response = await server.put("/booking/1").send(validPostBody);
            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
    
        it("should respond with status 401 if given token is not valid", async () => {
            const token = faker.lorem.word();
            const validPostBody = createValidBody();
            const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(validPostBody);
    
            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
    
        it("should respond with status 401 if there is no session for given token", async () => {
            const userWithoutSession = await createUser();
            const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
            const validPostBody = createValidBody();
            const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(validPostBody);
    
            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
        describe("when token is valid", () => {
            it("should respond with status 200 with a valid body", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const booking = await createBooking({
                    roomId: room.id,
                    userId: user.id
                })
                const room2 = await createRoomWithHotelId(hotel.id);
                const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: room2.id });
    
                expect(response.status).toEqual(httpStatus.OK);
            });
            it("should respond with status 400 with a invalid booking id", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const booking = await createBooking({
                    roomId: room.id,
                    userId: user.id
                })
                const room2 = await createRoomWithHotelId(hotel.id);
                const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send({ roomId: room2.id });
    
                expect(response.status).toEqual(httpStatus.BAD_REQUEST);
            });
            it("should respond with status 400 with a invalid body", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const booking = await createBooking({
                    roomId: room.id,
                    userId: user.id
                })
                const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
    
                expect(response.status).toEqual(httpStatus.BAD_REQUEST);
            });
            it("should respond with status 404 with an invalid body and there is no roomId", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const booking = await createBooking({
                    roomId: room.id,
                    userId: user.id
                })
    
                const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: room.id + 1 });
    
                expect(response.status).toEqual(httpStatus.NOT_FOUND);
            });
            it("should respond with status 403 with an invalid body and that there are no vacancies", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const room2 = await createRoomWithHotelId(hotel.id);
                const booking = await createBooking({
                    userId: user.id,
                    roomId: room2.id,
                });
                await createBooking({
                    userId: user.id,
                    roomId: room2.id,
                });
                await createBooking({
                    userId: user.id,
                    roomId: room2.id,
                });
    
                const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({
                    roomId: room2.id,
                });
    
                expect(response.status).toEqual(httpStatus.FORBIDDEN);
            });
            it("should respond with status 404 when the user does not have a booking", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const payment = await createPayment(ticket.id, ticketType.price);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
    
                const user2 = await createUser();
                const user2Booking = await createBooking({
                    userId: user2.id,
                    roomId: room.id,
                });
    
                const validBody = createValidBody();
                const response = await server.put(`/booking/${user2Booking.id}`).set("Authorization", `Bearer ${token}`).send({
                    roomId: room.id,
                });
    
                expect(response.status).toEqual(httpStatus.FORBIDDEN);
            });
        });
    });
})