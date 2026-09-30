<?php

namespace App\Controller\Admin;

use App\Entity\RepositoryEntity;
use App\Entity\TraitEntity;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\RouterInterface;

class DashboardController extends AbstractDashboardController
{
    /**
     * @var RouterInterface
     */
    private RouterInterface $router;

    public function __construct(RouterInterface $router)
    {
        $this->router = $router;
    }

    /**
     * @Route("/", name="admin")
     */
    public function index(): Response
    {
        $adminUrlGenerator = $this->container->get(AdminUrlGenerator::class);

        return $this->redirect($adminUrlGenerator->setController(RepositoryEntityCrudController::class)->generateUrl());
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('PHP Traits');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::section('Entities');
        yield MenuItem::linkToCrud('Repositories', 'fa fa-database', RepositoryEntity::class);
        yield MenuItem::linkToCrud('Traits', 'fa fa-code', TraitEntity::class);

        yield MenuItem::section('Administration');
        yield MenuItem::linkToRoute('Actions', 'fa fa-gears', 'admin_actions');

        yield MenuItem::section('Views');
        foreach ($this->router->getRouteCollection()->all() as $route) {
            if (str_contains($route->getPath(), '/view/')) {
                yield MenuItem::linkToRoute($route->getDefault('title'), 'fa fa-file-invoice', $route->getDefault('route_name'));
            }
        }
    }
}
