<?php

namespace App\Controller;

use App\Repository\TraitEntityRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ViewController extends AbstractController
{
    #[Route('/view/all', name: 'app_view_all', defaults: ['title' => "All Traits", 'route_name' => 'app_view_all'])]
    public function viewAll(TraitEntityRepository $entityRepository): Response
    {
        return $this->render('view/index.html.twig', [
            'controller_name' => 'ViewController',
            'title' => 'DENEME',
            'traits' => $entityRepository->findAll()
        ]);
    }

    #[Route('/view/useful', name: 'app_view_useful', defaults: ['title' => "Useful Traits", 'route_name' => 'app_view_useful'])]
    public function viewUseful(TraitEntityRepository $entityRepository): Response
    {
        return $this->render('view/index.html.twig', [
            'controller_name' => 'ViewController',
            'traits' => $entityRepository->findAll()
        ]);
    }

    #[Route('/view/independent', name: 'app_view_independent', defaults: ['title' => "Independent Traits", 'route_name' => 'app_view_independent'])]
    public function viewIndependent(TraitEntityRepository $entityRepository): Response
    {
        return $this->render('view/index.html.twig', [
            'controller_name' => 'ViewController',
            'traits' => $entityRepository->findAll()
        ]);
    }
}
